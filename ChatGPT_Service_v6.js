function SendMessage() {
    // Get variables from Articulate Storyline
    const player = GetPlayer();
    const message = player.GetVar("message");
    const systemPrompt = player.GetVar("systemPrompt");
    const modelVersion = player.GetVar("modelVersion");
    const proxyUrl = player.GetVar("proxyUrl");

    // Set 'loading' to true at the start of the API request
    player.SetVar("loading", true);

    // Set up API request
    function sendMessage() {
        const xhr = new XMLHttpRequest();
        xhr.open('POST', proxyUrl, true);
        xhr.setRequestHeader('Content-Type', 'application/json');

        xhr.onreadystatechange = () => {
            if (xhr.readyState === 4) {
                // Set 'loading' to false when the API request is complete
                player.SetVar("loading", false);

                if (xhr.status === 200) {
                    const apiResponse = JSON.parse(xhr.responseText);
                    if (apiResponse.choices?.[0]) {
                        const generatedResponse = apiResponse.choices[0].message.content;

                        try {
                            // Attempt to parse the response as JSON
                            const parsedResponse = JSON.parse(generatedResponse);

                            // If the response is valid JSON, iterate through the keys and set variables
                            if (typeof parsedResponse === "object" && parsedResponse !== null) {
                                for (const key in parsedResponse) {
                                    if (Object.hasOwn(parsedResponse, key)) {
                                        // Check if the key exists in Articulate Storyline
                                        if (player.GetVar(key) !== undefined) {
                                            // Check if the variable is an array of strings
                                            if (Array.isArray(parsedResponse[key]) && parsedResponse[key].every(item => typeof item === "string")) {
                                                player.SetVar(key, parsedResponse[key].join("\n"));
                                            } else {
                                                player.SetVar(key, parsedResponse[key]);
                                            }
                                        } else {
                                            console.warn(`Variable '${key}' does not exist in Storyline.`);
                                        }
                                    }
                                }
                            } else {
                                console.warn("Parsed response is not a valid JSON object.");
                            }
                        } catch (e) {
                            // If parsing fails, treat the response as plain text
                            console.warn("Response is not a JSON object. Returning as plain text.");
                            player.SetVar("response", generatedResponse);
                        }
                    } else {
                        console.error("Unexpected API response:", JSON.stringify(apiResponse));
                    }
                } else {
                    console.error("Error in API request:", xhr.status, xhr.statusText, xhr.responseText);
                }
            }
        };

        const data = JSON.stringify({
            "model": modelVersion || "gpt-4o-mini",
            "messages": [
                {
                    "role": "system",
                    "content": systemPrompt || "You are a helpful assistant." // Use custom system prompt if provided
                },
                {
                    "role": "user",
                    "content": message
                }
            ]
        });

        xhr.send(data);
    }

    sendMessage();
}

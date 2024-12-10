function SendMessage() {
    // Get variables from Articulate Storyline
    var player = GetPlayer();
    var message = player.GetVar("message");
    var response = player.GetVar("response");
    var apiKey = player.GetVar("apiKey");
    var systemPrompt = player.GetVar("systemPrompt");
    var modelVersion = player.GetVar("modelVersion");
    apiKey = "Bearer " + apiKey;

    // Set 'loading' to true at the start of the API request
    player.SetVar("loading", true);

    // Set up API request
    function sendMessage() {
        var xhr = new XMLHttpRequest();
        var url = 'https://api.openai.com/v1/chat/completions';
        xhr.open('POST', url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.setRequestHeader('Authorization', apiKey);

        xhr.onreadystatechange = function () {
            if (xhr.readyState === 4) {
                // Set 'loading' to false when the API request is complete
                player.SetVar("loading", false);

                if (xhr.status === 200) {
                    var apiResponse = JSON.parse(xhr.responseText);
                    if (apiResponse.choices && apiResponse.choices[0]) {
                        var generatedResponse = apiResponse.choices[0].message.content;

                        try {
                            // Attempt to parse the response as JSON
                            var parsedResponse = JSON.parse(generatedResponse);

                            // If the response is valid JSON, iterate through the keys and set variables
                            if (typeof parsedResponse === "object" && parsedResponse !== null) {
                                for (var key in parsedResponse) {
                                    if (parsedResponse.hasOwnProperty(key)) {
                                        // Check if the key exists in Articulate Storyline
                                        if (player.GetVar(key) !== undefined) {
                                            player.SetVar(key, parsedResponse[key]);
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

        var data = JSON.stringify({
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

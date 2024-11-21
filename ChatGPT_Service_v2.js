function SendMessage() {
    // Get variables from Articulate Storyline
    var player = GetPlayer();
    var message = player.GetVar("message");
    var response = player.GetVar("response");
    var apiKey = player.GetVar("apiKey");
    var systemPrompt = player.GetVar("systemPrompt"); // New variable for custom system prompt

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
                        // Update Articulate Storyline variables
                        player.SetVar("response", generatedResponse);
                    } else {
                        console.error("Unexpected API response:", JSON.stringify(apiResponse));
                    }
                } else {
                    console.error("Error in API request:", xhr.status, xhr.statusText, xhr.responseText);
                }
            }
        };

        var data = JSON.stringify({
            "model": "gpt-3.5-turbo",
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

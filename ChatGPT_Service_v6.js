function SendMessage() {
    const player       = GetPlayer();
    const message      = player.GetVar("message");
    const systemPrompt = player.GetVar("systemPrompt");
    const modelVersion = player.GetVar("modelVersion") || "gpt-4o-mini";
    const proxyUrl     = player.GetVar("proxyUrl");

    // indicate loading in Storyline
    player.SetVar("loading", true);

    // build our payload to match the proxy’s expectations
    const payload = {
        model:       modelVersion,
        systemPrompt,
        message
    };

    fetch(proxyUrl, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload)
    })
    .then(async res => {
        // done loading
        player.SetVar("loading", false);

        if (!res.ok) {
            const errTxt = await res.text();
            console.error("Proxy error:", res.status, res.statusText, errTxt);
            return;
        }

        return res.json();
    })
    .then(data => {
        if (!data) return;

        const choice = data.choices?.[0];
        if (!choice) {
            console.error("Unexpected API response:", data);
            return;
        }

        const generated = choice.message?.content;
        if (typeof generated !== "string") {
            console.error("No content in choice:", choice);
            return;
        }

        // try to parse JSON-out
        let parsed;
        try {
            parsed = JSON.parse(generated);
        } catch {
            parsed = null;
        }

        if (parsed && typeof parsed === "object") {
            for (const key in parsed) {
                if (!Object.hasOwn(parsed, key)) continue;

                const value = parsed[key];
                if (Array.isArray(value) && value.every(item => typeof item === "string")) {
                    player.SetVar(key, value.join("\n"));
                } else {
                    player.SetVar(key, value);
                }
            }
        } else {
            // fallback: raw text
            player.SetVar("response", generated);
        }
    })
    .catch(err => {
        player.SetVar("loading", false);
        console.error("Fetch failed:", err);
    });
}

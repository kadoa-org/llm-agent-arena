<p align="center">
  <img src="https://github.com/AdrianKrebs/claude-gpt-agentic-comparison/blob/master/logo-github.png" height="300" alt="agent-comparison" />
</p>


# LLM Agent Arena
Welcome to the LLM Agent Arena, where large language models compete against each other in using tools and function calls to accomplish various tasks.
I've been working with GPT function calling for a while and noticed that there is no tool usage/function calling comparison available.
This project aims to compare the performance of different language models, such as Claude, GPT, Llama, and Gemini, in handling complex chains of tool calls.

## Features

- A set of predefined tools for web scraping and browser automation
- Dummy implementations of each tool for testing purposes
- Test scenarios to evaluate the models' ability to select and use the appropriate tools
- Metrics to compare the performance of Claude and GPT function calling

## Supported Agents
- Claude
- GPT
- Groq Llama
- Gemini

## Setup

1. Install the required dependencies:
   ```
   npm install
   ```

2. Set your Anthropic and OpenAI API keys as environment variables:
   ```
   export ANTHROPIC_API_KEY=your_anthropic_api_key
   export OPENAI_API_KEY=your_openai_api_key
   ```

3. Run the comparison:
   ```
   node index.js
   ```

## Results & Leaderboard


### Scenario 1: Hard Task


| Model                   | Avg Tool Calls | Avg Accuracy | Avg Costs   |
|-------------------------|----------------|--------------|-------------|
| claude-3-opus-20240229  | 16             | 100%         | $0.807255   |
| gpt-4-0125-preview      | 13             | 81.25%       | $0.153540   |
| claude-3-sonnet-20240229| 11             | 87.5%        | $0.119638   |
| gpt-3.5-turbo-0125      | 9              | 79.17%       | $0.008145   |
| llama3-70b-8192         | 9              | 78.13%       | $0.005027   |


### Scenario 2: Easy Task

Coming soon...

## Test Scenarios
You can customize the default test scenario or add your own:
```
    {
        "query": "You are an RPA bot. If you're missing a CSS selector, you need to call the find_selector tool by providing the description. To find a specific webpage by description, call the find_page tool. Here is your task: Log in to https://example.com using the provided credentials. Navigate to the 'Products' page and extract the names and prices of all products that are currently in stock. For each product, check if there is a detailed specification PDF available by hovering over the 'Info' button and extracting the link. If a PDF is available, download it and extract the table of technical specifications. Finally, upload the parsed technical specifications to the file server.",
        "expectedTools": [
            "handle_login",
            "navigate_to_url",
            "extract_text",
            "hover_element",
            "extract_attribute",
            "download_and_parse_pdf",
            "extract_specs_table",
            "upload_to_file_server"
        ],
        "expectedLastStep": "upload_to_file_server",
        "parameters": {
            "login_url": "https://example.com/login",
            "submit_selector": "#login-button",
            "username": "testuser",
            "password": "testpassword"
        }
    }

```

## Mock Tools
You can add your own mock tools or edit the existing list of tools:
```
    {
        "name": "navigate_to_url",
        "description": "Navigate to a specific URL in a headless browser.",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "The URL to navigate to, e.g., https://www.example.com"
                }
            },
            "required": ["url"]
        },
        "function": async function (args) {
            console.log(`Navigating to ${args}`);
            return {success: true}
        }
    }

```

## Contributing

Feel free to contribute by adding more models, tools, test cases, or improving the evaluation metrics. Open a pull request with your changes.

## License

This project is licensed under the MIT License.
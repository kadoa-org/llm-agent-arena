<p align="center">
  <img src="https://github.com/AdrianKrebs/claude-gpt-agentic-comparison/blob/master/logo-github.png" height="300" alt="agent-comparison" />
</p>


# Claude vs GPT Agent Comparison
Anthropics [recent announcement of tools (function calls)](https://docs.anthropic.com/claude/docs/tool-use) for Claude caught my attention, specifically this claim:

> All models can handle correcting choosing a tool from 250+ tools provided the user query contains all necessary parameters for the intended tool with >90% accuracy.
These limits apply to the total number of tools, regardless of complexity. A "complex" tool would be one with a large number of parameters or parameters with complex schemas (e.g. nested objects).

This is pretty exciting news for everybody working with agentic systems. OpenAI has way lower recall.

So I wanted compare GPT function calls to Claude tools and report back on the evaluation results.

This repository contains a comparison of the agentic capabilities of Anthropic's Claude and OpenAI's GPT models. The focus is on evaluating their performance in using different tools/functions for tasks like web scraping and browser automation.

## Features

- A set of predefined tools for web scraping and browser automation
- Dummy implementations of each tool for testing purposes
- Test scenarios to evaluate the models' ability to select and use the appropriate tools
- Metrics to compare the performance of Claude and GPT function calling

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


## Results

| Metric          | claude-3-opus-20240229 | gpt-4-0125-preview | claude-3-sonnet-20240229 | gpt-3.5-turbo-0125 |
|-----------------|------------------------|--------------------|--------------------------|--------------------|
| Avg Tool Calls  | 16                     | 13                 | 11                       | 9                  |
| Avg Accuracy    | 100%                   | 81.25%             | 87.5%                    | 79.17%                |
| Avg Costs       | $0.807255              | $0.153540          | $0.119638                | $0.008145          | 


The comparison results will be logged to the console, showing the performance of each model on the defined test cases.

```
 
Claude Evaluation:
Model Used: claude-3-sonnet-20240229
Number of Tool Calls: 12
Tools Used: find_page,find_css_selector,find_css_selector,handle_login,find_page,navigate_to_url,extract_json,hover_element,extract_attribute,download_and_parse_pdf,extract_specs_table,upload_to_file_server
Tools Accuracy: 0.875
Correct Result: true
Cost: $0.136581

GPT Evaluation:
Model Used: gpt-3.5-turbo-0125
Number of Tool Calls: 9
Tools Used: handle_login,navigate_to_url,extract_html,find_css_selector,find_page,hover_element,extract_attribute,download_and_parse_pdf,upload_to_file_server
Tools Accuracy: 0.75
Correct Result: true
Cost: $0.007377
   ```

## Contributing

Feel free to contribute by adding more tools, test cases, or improving the evaluation metrics. Open a pull request with your changes.

## License

This project is licensed under the MIT License.
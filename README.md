<p align="center">
  <img src="https://github.com/AdrianKrebs/claude-gpt-agentic-comparison/blob/master/logo-github.png" height="300" alt="agent-comparison" />
</p>


# LLM Agent Arena
Welcome to the LLM Agent Arena, a benchmark to evaluate and compare function calling/tool usage across different LLMs.

## Features

- A set of predefined tools for a specific test task
- Dummy implementations of each tool for testing purposes
- Test scenarios to evaluate the models' ability to select and use the appropriate tools
- Metrics to compare the performance of function calling



## Results & Leaderboard


| Model                       | Completion Rate | Accuracy | Avg Costs   | 
|-----------------------------|-----------------|----------|-------------|
| claude-3-opus-20240229      | 100%            | 100%     | $0.807255   | 
| gemini-1.5-pro-preview-0514 | 100%            | 100%     | $0.012401   |
| gpt-4o                      | 100%            | 100%     | $0.082180   |
| claude-3-sonnet-20240229    | 100%            | 100%     | $0.094014   | 
| gpt-3.5-turbo-0125          | 100%            | 77.7%    | $0.004343   | 
| llama3-70b-8192*            | 50%             | 78.13%   | $0.010536   | 

* currently in beta and not production ready yet on Groq Cloud

## Test Scenarios
You can customize the default test scenario or add your own:
```
        {
        "query":
            "Answer the user's request using relevant tools (if they are available). Before calling a tool, do some analysis. First, think about which of the provided tools is the relevant tool to answer the user's request. Second, go through each of the required parameters of the relevant tool and determine if the user has directly provided or given enough information to infer a value. When deciding if the parameter can be inferred, carefully consider all the context to see if it supports a specific value. If all of the required parameters are present or can be reasonably inferred, close the thinking tag and proceed with the tool call. BUT, if one of the values for a required parameter is missing, DO NOT invoke the function (not even with fillers for the missing params) and instead, ask the user to provide the missing parameters. DO NOT ask for more information on optional parameters if it is not provided." +
            "Here is your task: " +
            "1.) Navigate to https://example.com/products" +
            "2.) Extract the names and prices of all the products on the page. Params: {'schema': {'productName': string, 'price': string, 'link': string}}" +
            "3.) For the first product, use the link to navigate to the details page" +
            "4.) On the product details page, click on the 'Specifications' collapsible. Params: {'headline': 'Product Specs'}" +
            "5.) Extract the specs table" +
            "6.) Upload specs JSON to the file server" +
            "7.) Extract the product image URL. Params: {'position': 'Top Left'}" +
            "8.) Download the product image" +
            "9.) Upload image to the file server" +
            "DONE",
        "expectedTools": [
            "navigate_to_url",
            "extract_product_data",
            "navigate_to_url",
            "click_element",
            "extract_specs_table",
            "upload_to_file_server",
            "extract_image_url",
            "download_image",
            "upload_image_to_file_server"
        ],
        "expectedLastStep": "upload_image_to_file_server",
        "level": "medium"
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

## Setup

1. Install the required dependencies:
   ```
   npm install
   ```

2. Set your LLM API keys as environment variables:
   ```
   export ANTHROPIC_API_KEY=your_anthropic_api_key
   export OPENAI_API_KEY=your_openai_api_key
   ```

3. Run the comparison:
   ```
   node index.js
   ```



## Contributing

Feel free to contribute by adding more models, tools, test cases, or improving the evaluation metrics. Open a pull request with your changes.

## License

This project is licensed under the MIT License.
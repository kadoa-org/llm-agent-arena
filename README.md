# Claude-GPT Agentic Comparison

This repository contains a comparison of the agentic capabilities of Anthropic's Claude and OpenAI's GPT models. The focus is on evaluating their performance in using different tools/functions for tasks like web scraping and browser automation.

## Features

- A set of predefined tools for web scraping and browser automation
- Dummy implementations of each tool for testing purposes
- Test cases to evaluate the models' ability to select and use the appropriate tools
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

## Results

The comparison results will be logged to the console, showing the performance of each model on the defined test cases. Metrics include tool selection accuracy, argument accuracy, and latency.

   ```
   Claude Evaluation:
   Number of Tool Calls: 14
   Tools Used: find_css_selector,find_css_selector,handle_login,find_page,navigate_to_url,find_css_selector,extract_text,find_css_selector,hover_element,find_css_selector,extract_attribute,download_and_parse_pdf,extract_specs_table,upload_to_file_server
   Tools Accuracy: 1
   Correct Result: true

   GPT Evaluation:
   Number of Tool Calls: 11
   Tools Used: handle_login,find_page,navigate_to_url,extract_text,extract_text,extract_text,hover_element,extract_links,extract_links,download_and_parse_pdf,upload_to_file_server
   Tools Accuracy: 0.75
   Correct Result: true
   ```

## Contributing

Feel free to contribute by adding more tools, test cases, or improving the evaluation metrics. Open a pull request with your changes.

## License

This project is licensed under the MIT License.
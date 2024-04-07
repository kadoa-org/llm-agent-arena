const {Anthropic}  = require('@anthropic-ai/sdk');
const OpenAI = require("openai");


const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const tools = [
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
    },
    {
        "name": "fill_form",
        "description": "Fill out a form on the current web page.",
        "input_schema": {
            "type": "object",
            "properties": {
                "form_selector": {
                    "type": "string",
                    "description": "The CSS selector for the form, e.g., #search-form"
                },
                "fields": {
                    "type": "object",
                    "description": "The form fields to fill out, as key-value pairs"
                }
            },
            "required": ["form_selector", "fields"]
        },
        "function": async function (args) {
            console.log(`Filling form ${args}`);
            return {success: true}
        }
    },
    {
        "name": "click_element",
        "description": "Click on an element on the current web page.",
        "input_schema": {
            "type": "object",
            "properties": {
                "selector": {
                    "type": "string",
                    "description": "The CSS selector for the element to click, e.g., #submit-button"
                }
            },
            "required": ["selector"]
        },
        "function": async function (args) {
            console.log(`Clicking element ${args}`);
            return {success: true}
        }
    },
    {
        "name": "extract_text",
        "description": "Extract text content from the current web page.",
        "input_schema": {
            "type": "object",
            "properties": {
                "selector": {
                    "type": "string",
                    "description": "The CSS selector for the element to extract text from, e.g., .article-body"
                }
            },
            "required": ["selector"]
        },
        "function": async function (args) {
            console.log(`Extracting text from ${args}`);
            // Simulate text extraction
            return "Product1: $23, Product2: $23, Product3: $232";
        }
    },
    {
        "name": "extract_links",
        "description": "Extract all links from the current web page.",
        "input_schema": {
            "type": "object",
            "properties": {
                "base_url": {
                    "type": "string",
                    "description": "The base URL to resolve relative links, e.g., https://www.example.com"
                }
            },
            "required": ["base_url"]
        },
        "function": async function (args) {
            console.log(`Extracting links with base URL ${args.base_url}`);
            // Simulate link extraction
            return ["https://example.com/link1", "https://example.com/link2"];
        }
    },
    {
        "name": "take_screenshot",
        "description": "Take a screenshot of the current web page.",
        "input_schema": {
            "type": "object",
            "properties": {
                "filename": {
                    "type": "string",
                    "description": "The filename to save the screenshot as, e.g., screenshot.png"
                }
            },
            "required": ["filename"]
        },
        "function": async function (args) {
            console.log(`Taking screenshot and saving as ${args.filename}`);
            return {success: true}
        }
    },
    {
        "name": "analyze_network_traffic",
        "description": "Analyze the network traffic of the current web page.",
        "input_schema": {
            "type": "object",
            "properties": {
                "url_pattern": {
                    "type": "string",
                    "description": "A regex pattern to filter network requests by URL, e.g., https://api\\.example\\.com/.*"
                }
            }
        },
        "function": async function (args) {
            console.log(`Analyzing network traffic for URLs matching ${args.url_pattern}`);
            // Simulate network analysis
            return ["https://api.example.com/data", "https://api.example.com/user"];
        }
    },
    {
        "name": "scroll_to_bottom",
        "description": "Scroll to the bottom of the current web page.",
        "input_schema": {
            "type": "object",
            "properties": {}
        },
        "function": async function () {
            console.log("Scrolling to bottom of the page");
            return {success: true}
        }
    },
    {
        "name": "wait_for_element",
        "description": "Wait for an element to appear on the current web page.",
        "input_schema": {
            "type": "object",
            "properties": {
                "selector": {
                    "type": "string",
                    "description": "The CSS selector for the element to wait for, e.g., #loading-spinner"
                },
                "timeout": {
                    "type": "integer",
                    "description": "The maximum time to wait for the element in milliseconds, e.g., 5000"
                }
            },
            "required": ["selector", "timeout"]
        },
        "function": async function (args) {
            console.log(`Waiting for element ${args.selector} with timeout ${args.timeout}ms`);
            return {success: true}
        }
    },
    {
        "name": "extract_attribute",
        "description": "Extract the value of an attribute from an element on the current web page.",
        "input_schema": {
            "type": "object",
            "properties": {
                "selector": {
                    "type": "string",
                    "description": "The CSS selector for the element, e.g., #product-image"
                },
                "attribute": {
                    "type": "string",
                    "description": "The name of the attribute to extract, e.g., src"
                }
            },
            "required": ["selector", "attribute"]
        },
        "function": async function (args) {
            console.log(`Extracting attribute ${args}`);
            // Simulate attribute extraction
            return "https://testsite.com/products/1232/specs.pdf";
        }
    },
    {
        "name": "download_and_parse_pdf",
        "description": "Download a file from a URL.",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "The URL of the file to download, e.g., https://example.com/data.csv"
                }
            },
            "required": ["url"]
        },
        "function": async function (args) {
            console.log(`Downloading file from ${args}`);
            return "PDF Content ---- Tech specifications: \t44\t49\t52\t54\t56\t58\t61\t64\n" +
                "Crank Length\t165mm\t165mm\t170mm\t172.5mm\t172.5mm\t175mm\t175mm\t175mm\n" +
                "Handlebar Width\t380mm\t380mm\t400mm\t420mm\t420mm\t440mm\t440mm\t440mm\n" +
                "Stem Length\t60mm\t60mm\t70mm\t80mm\t90mm\t100mm\t100mm\t110mm\n" +
                "Saddle Width\t155mm\t155mm\t155mm\t143mm\t143mm\t143mm\t143mm\t143mm\n" +
                "Seatpost Length\t350mm\t350mm\t350mm\t400mm\t400mm\t400mm\t400mm\t400mm\n" +
                "Stack\t568mm\t571mm\t577mm\t592mm\t610mm\t634mm\t659mm\t684mm\n"
        }
    },
    {
        "name": "upload_to_file_server",
        "description": "Upload a JSON file to a file server",
        "input_schema": {
            "type": "object",
            "properties": {
                "content": {
                    "type": "string",
                    "description": "The file content to upload"
                }
            },
            "required": ["content"]
        },
        "function": async function (args) {
            console.log(`Uploading file ${args}`);
            return {success: true}
        }
    },
    {
        "name": "extract_specs_table",
        "description": "Extract data from a PDF table",
        "input_schema": {
            "type": "object",
            "properties": {
                "pdf_content": {
                    "type": "string",
                    "description": "The PDF content"
                }
            },
            "required": ["pdf_content"]
        },
        "function": async function (args) {
            console.log(`Extracting table data from ${args}`);
            // Simulate table extraction
            return [
                { column1: "row1_value1", column2: "row1_value2" },
                { column1: "row2_value1", column2: "row2_value2" },
            ];
        }
    },
    {
        "name": "handle_pagination",
        "description": "Handle pagination by clicking 'Next' until the last page.",
        "input_schema": {
            "type": "object",
            "properties": {
                "next_button_selector": {
                    "type": "string",
                    "description": "The CSS selector for the 'Next' button, e.g., .pagination .next"
                }
            },
            "required": ["next_button_selector"]
        },
        "function": async function (args) {
            console.log(`Handling pagination with next button ${args}`);
            return {success: true}
        }
    },
    {
        "name": "extract_json",
        "description": "Extract JSON data from the current web page.",
        "input_schema": {
            "type": "object",
            "properties": {
                "selector": {
                    "type": "string",
                    "description": "The CSS selector for the element containing the JSON data, e.g., #json-data"
                }
            },
            "required": ["selector"]
        },
        "function": async function (args) {
            console.log(`Extracting JSON data from ${args}`);
            // Simulate JSON extraction
            return { key1: "value1", key2: "value2" };
        }
    },
    {
        "name": "handle_infinite_scroll",
        "description": "Handle infinite scroll by scrolling until no more new content loads.",
        "input_schema": {
            "type": "object",
            "properties": {
                "content_selector": {
                    "type": "string",
                    "description": "The CSS selector for the content elements, e.g., .post"
                },
                "delay": {
                    "type": "integer",
                    "description": "The delay between scrolls in milliseconds, e.g., 2000"
                }
            },
            "required": ["content_selector", "delay"]
        },
        "function": async function (args) {
            console.log(`Handling infinite scroll for content ${args}`);
            return {success: true}
        }
    },
    {
        "name": "solve_captcha",
        "description": "Solve a CAPTCHA on the current web page.",
        "input_schema": {
            "type": "object",
            "properties": {
                "image_selector": {
                    "type": "string",
                    "description": "The CSS selector for the CAPTCHA image, e.g., #captcha-image"
                },
                "input_selector": {
                    "type": "string",
                    "description": "The CSS selector for the CAPTCHA input field, e.g., #captcha-input"
                },
                "submit_selector": {
                    "type": "string",
                    "description": "The CSS selector for the CAPTCHA submit button, e.g., #captcha-submit"
                }
            },
            "required": ["image_selector", "input_selector", "submit_selector"]
        },
        "function": async function (args) {
            console.log(`Solving CAPTCHA with image ${args}`);
            return {success: true}
        }
    },
    {
        "name": "handle_login",
        "description": "Log in to a website using provided credentials.",
        "input_schema": {
            "type": "object",
            "properties": {
                "url": {
                    "type": "string",
                    "description": "The URL of the login page, e.g., https://example.com/login"
                },
                "username_selector": {
                    "type": "string",
                    "description": "The CSS selector for the username input field, e.g., #username"
                },
                "password_selector": {
                    "type": "string",
                    "description": "The CSS selector for the password input field, e.g., #password"
                },
                "submit_selector": {
                    "type": "string",
                    "description": "The CSS selector for the login submit button, e.g., #login-button"
                },
                "username": {
                    "type": "string",
                    "description": "The username to log in with"
                },
                "password": {
                    "type": "string",
                    "description": "The password to log in with"
                }
            },
            "required": ["url", "username_selector", "password_selector", "submit_selector", "username", "password"]
        },
        "function": async function (args) {
            console.log(`Logging in at ${args}`);
            return {success: true}
        }
    },
    {
        "name": "extract_html",
        "description": "Extract the HTML source of the current web page.",
        "input_schema": {
            "type": "object",
            "properties": {}
        },
        "function": async function () {
            console.log("Extracting HTML source");
            // Simulate HTML extraction
            return "<html><body><p>Product 1: $123 (out of stock)</p><p>Product 2: $125 (in stock)</p></body></html>";
        }
    },
    {
        "name": "handle_alert",
        "description": "Handle an alert dialog on the current web page.",
        "input_schema": {
            "type": "object",
            "properties": {
                "accept": {
                    "type": "boolean",
                    "description": "Whether to accept (true) or dismiss (false) the alert"
                }
            },
            "required": ["accept"]
        },
        "function": async function (args) {
            console.log(`Handling alert with accept=${args}`);
            return {success: true}
        }
    },
    {
        "name": "extract_metadata",
        "description": "Extract metadata from the current web page.",
        "input_schema": {
            "type": "object",
            "properties": {
                "name": {
                    "type": "string",
                    "description": "The name of the metadata to extract, e.g., description"
                }
            },
            "required": ["name"]
        },
        "function": async function (args) {
            console.log(`Extracting metadata ${args}`);
            // Simulate metadata extraction
            return "dummy_metadata_value";
        }
    },
    {
        "name": "hover_element",
        "description": "Hover over an element on the current web page.",
        "input_schema": {
            "type": "object",
            "properties": {
                "selector": {
                    "type": "string",
                    "description": "The CSS selector for the element to hover over, e.g., #menu-item"
                }
            },
            "required": ["selector"]
        },
        "function": async function (args) {
            console.log(`Hovering over element ${args}`);
            return {success: true}
        }
    },
    {
        "name": "find_css_selector",
        "description": "Find CSS selector for a description of an element",
        "input_schema": {
            "type": "object",
            "properties": {
                "element": {
                    "type": "string",
                    "description": "the element to find, e.g. login button"
                }
            },
            "required": ["element"]
        },
        "function": async function (args) {
            console.log(`Finding selector ${args}`);
            return "#sdf123"
        }
    },
    {
        "name": "find_page",
        "description": "Find a website URL based on the description",
        "input_schema": {
            "type": "object",
            "properties": {
                "element": {
                    "type": "string",
                    "description": "the link or page to find, e.g. product page"
                }
            },
            "required": ["element"]
        },
        "function": async function (args) {
            console.log(`Finding page ${args}`);
            return "/shop/subpage"
        }
    },
    {
        "name": "select_dropdown",
        "description": "Select an option from a dropdown on the current web page.",
        "input_schema": {
            "type": "object",
            "properties": {
                "selector": {
                    "type": "string",
                    "description": "The CSS selector for the dropdown, e.g., #country-select"
                },
                "value": {
                    "type": "string",
                    "description": "The value of the option to select, e.g., US"
                }
            },
            "required": ["selector", "value"]
        },
        "function": async function (args) {
            console.log(`Selecting option ${args}`);
            return {success: true}
        }
    }
];


const testCases = [
    {
        "query": "You're an RPA bot. If you need to find a css selector or find a page you should call the find_page or find_selector function. Here is your task: Log in to https://example.com using the provided credentials. Navigate to the 'Products' page and extract the names and prices of all products that are currently in stock. For each product, check if there is a detailed specification PDF available by hovering over the 'Info' button and extracting the link. If a PDF is available, download it and extract the table of technical specifications. Finally, upload the parsed technical specifications to the file server. ",
        "expectedTools": ["handle_login", "navigate_to_url", "extract_text", "hover_element", "extract_attribute", "download_file", "extract_table", "fill_form", "click_element"],
        "expectedOutput": "Submitted a list of 5 products with technical specifications to the contact form.",
        "parameters": {
            "login_url": "https://example.com/login",
            "submit_selector": "#login-button",
            "username": "testuser",
            "password": "testpassword"
        }
    }
];

async function testClaude(testCase) {
    const results = []
    let messages = [
        {
            "role": "user",
            "content": `${testCase.query}\n\nAdditional Parameters:\n${JSON.stringify(testCase.parameters, null, 2)}`
        }
    ];

    let response = await anthropic.messages.create(
        {
            max_tokens: 3024,
            model: 'claude-3-opus-20240229',
            tools: tools,
            messages: messages
        },
        { headers: { 'anthropic-beta': 'tools-2024-04-04' } }
    );

    console.log(`\nInitial Response:`);
    console.log(`Stop Reason: ${response.stop_reason}`);
    console.log(`Content: ${JSON.stringify(response.content, null, 2)}`);

    while (response.stop_reason === "tool_use") {
        const toolUse = response.content.find(block => block.type === "tool_use");
        const toolName = toolUse.name;
        const toolInput = toolUse.input;
        results.push(toolUse)
        const toolFunction = tools.find(tool => tool.name === toolName).function;
        const toolResult = await toolFunction(JSON.stringify(toolInput, null, 2));

        messages = [
            ...messages,
            { "role": "assistant", "content": response.content },
            {
                "role": "user",
                "content": [
                    {
                        "type": "tool_result",
                        "tool_use_id": toolUse.id,
                        "content": JSON.stringify(toolResult),
                    }
                ],
            },
        ];

        response = await anthropic.messages.create(
            {
                max_tokens: 3024,
                model: 'claude-3-opus-20240229',
                tools: tools,
                messages: messages
            },
            { headers: { 'anthropic-beta': 'tools-2024-04-04' } }
        );

        console.log(`\nResponse:`);
        console.log(`Stop Reason: ${response.stop_reason}`);
        console.log(`Content: ${JSON.stringify(response.content, null, 2)}`);
    }

    const finalResponse = response.content.find(block => block.type === "text")?.text;
    console.log(`\nFinal Response: ${finalResponse}`);
    results.push(finalResponse)
    return results
}

async function testGPT(testCase) {
    const results = []
    const mappedTools = tools.map(tool => ({
        type: 'function',
        function: {
            name: tool.name,
            description: tool.description,
            function: tool.function,
            parameters: tool.input_schema,
        },
    }));
    const runner = openai.beta.chat.completions
        .runTools({
            model: 'gpt-4-0125-preview',
            messages: [{ role: 'user', content: `${testCase.query}\n\nAdditional Parameters:\n${JSON.stringify(testCase.parameters, null, 2)}` }],
            tools: mappedTools,
        })
        .on('message', (message) => {
            console.log(message)
            results.push(message)
        });

    const finalContent = await runner.finalContent();
    console.log('Final content:', finalContent);
    results.push(finalContent)
    return results;
}


async function main() {
    const claudeResults = [];
    const gptResults = [];

    for (const testCase of testCases) {
        console.log(`\n${'='.repeat(50)}\nTest Case: ${testCase.query}\n${'='.repeat(50)}`);
        const claudeResult = await testClaude(testCase);
        claudeResults.push(claudeResult);

        const gptResult = await testGPT(testCase);
        gptResults.push(gptResult);
    }

    // Aggregate the results and print out a comparison
    // You can calculate overall metrics across all test cases
    // like average accuracy, total test runtime, etc.
    console.log('Claude Results:', claudeResults);
    console.log('GPT Results:', gptResults);
}

main();
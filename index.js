const {Anthropic} = require('@anthropic-ai/sdk');
const OpenAI = require("openai");
const tools = require("./tools");
const fs = require('fs').promises;


const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});


const CLAUDE_MODEL = "claude-3-sonnet-20240229"
const GPT_MODEL = "gpt-4-0125-preview"

const costConfig = {
    'gpt-4-0125-preview': {
        inputCostPer1MTokens: 10.00,
        outputCostPer1MTokens: 30.00,
    },
    'gpt-3.5-turbo-0125': {
        inputCostPer1MTokens: 0.50,
        outputCostPer1MTokens: 1.50,
    },
    'claude-3-opus-20240229': {
        inputCostPer1MTokens: 15.00,
        outputCostPer1MTokens: 75.00,
    },
    'claude-3-sonnet-20240229': {
        inputCostPer1MTokens: 3.00,
        outputCostPer1MTokens: 15.00,
    },
};

const testCases = [
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
];

async function testClaude(testCase) {
    const results = []
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    let messages = [
        {
            "role": "user",
            "content": `${testCase.query}\n\nAdditional Parameters:\n${JSON.stringify(testCase.parameters, null, 2)}`
        }
    ];

    let response = await anthropic.messages.create(
        {
            max_tokens: 3024,
            model: CLAUDE_MODEL,
            tools: tools,
            messages: messages
        },
        {headers: {'anthropic-beta': 'tools-2024-04-04'}}
    );

    console.log(`\nInitial Response:`);
    console.log(`Stop Reason: ${response.stop_reason}`);
    console.log(`Content: ${JSON.stringify(response.content, null, 2)}`);

    while (response.stop_reason === "tool_use") {
        const toolUse = response.content.find(block => block.type === "tool_use");
        const toolName = toolUse.name;
        const toolInput = toolUse.input;
        totalInputTokens += response.usage.input_tokens;
        totalOutputTokens += response.usage.output_tokens;
        results.push(toolUse)
        const toolFunction = tools.find(tool => tool.name === toolName).function;
        const toolResult = await toolFunction(JSON.stringify(toolInput, null, 2));

        messages = [
            ...messages,
            {"role": "assistant", "content": response.content},
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
                model: CLAUDE_MODEL,
                tools: tools,
                messages: messages
            },
            {headers: {'anthropic-beta': 'tools-2024-04-04'}}
        );

        console.log(`\nResponse:`);
        console.log(`Stop Reason: ${response.stop_reason}`);
        console.log(`Content: ${JSON.stringify(response.content, null, 2)}`);
    }

    const finalResponse = response.content.find(block => block.type === "text")?.text;
    console.log(`\nFinal Response: ${finalResponse}`);
    results.push(finalResponse)

    const cost = calculateCost(CLAUDE_MODEL, totalInputTokens, totalOutputTokens);

    return {
        results,
        cost: cost.toFixed(6),
    };
}

async function testGPT(testCase) {
    const results = []
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

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
            model: GPT_MODEL,
            messages: [{
                role: 'user',
                content: `${testCase.query}\n\nAdditional Parameters:\n${JSON.stringify(testCase.parameters, null, 2)}`
            }],
            tools: mappedTools,
        })
        .on('message', (message) => {
            console.log(message)
            results.push(message)
        });

    const finalContent = await runner.finalContent();
    console.log('Final content:', finalContent);
    const finalUsage = await runner.totalUsage();
    totalInputTokens += finalUsage.prompt_tokens;
    totalOutputTokens += finalUsage.completion_tokens;
    const cost = calculateCost(GPT_MODEL, totalInputTokens, totalOutputTokens);

    results.push(finalContent)
    return {
        results,
        cost: cost.toFixed(6),
    };
}

function calculateAccuracy(usedTools, expectedTools) {
    const uniqueUsedTools = [...new Set(usedTools)];
    const correctTools = uniqueUsedTools.filter(tool => expectedTools.includes(tool));
    return correctTools.length / expectedTools.length;
}

function calculateCost(modelName, inputTokens, outputTokens) {
    const { inputCostPer1MTokens, outputCostPer1MTokens } = costConfig[modelName];

    const inputCost = (inputTokens / 1000000) * inputCostPer1MTokens;
    const outputCost = (outputTokens / 1000000) * outputCostPer1MTokens;

    return inputCost + outputCost;
}

async function main() {
    const claudeResults = [];
    const gptResults = [];

    for (const testCase of testCases) {
        console.log(`\n${'='.repeat(50)}\nTest Case: ${testCase.query}\n${'='.repeat(50)}`);

        const claudeResult = await testClaude(testCase);
        claudeResults.push(claudeResult.results);
        const claudeCost = claudeResult.cost;

        const gptResult = await testGPT(testCase);
        gptResults.push(gptResult.results);
        const gptCost = gptResult.cost;

        // Evaluate Claude's performance
        const claudeToolsUsed = claudeResult.results.filter(c => c.type === "tool_use").map(toolUse => toolUse.name);
        const claudeToolsAccuracy = calculateAccuracy(claudeToolsUsed, testCase.expectedTools);
        const claudeOutputAccuracy = claudeToolsUsed[claudeToolsUsed.length - 1] === testCase.expectedLastStep;

        console.log(`\nClaude Evaluation:`);
        console.log(`Model Used: ${CLAUDE_MODEL}`);
        console.log(`Number of Tool Calls: ${claudeToolsUsed.length}`);
        console.log(`Tools Used: ${claudeToolsUsed}`);
        console.log(`Tools Accuracy: ${claudeToolsAccuracy}`);
        console.log(`Correct Result: ${claudeOutputAccuracy}`);
        console.log(`Cost: $${claudeCost}`);

        // Evaluate GPT's performance
        const gptToolsUsed = gptResult.results.flatMap(message =>
            message.tool_calls ? message.tool_calls.map(toolCall => toolCall.function.name) : []
        );
        const gptToolsAccuracy = calculateAccuracy(gptToolsUsed, testCase.expectedTools);
        const gptOutputAccuracy = gptToolsUsed[gptToolsUsed.length - 1] === testCase.expectedLastStep;

        console.log(`\nGPT Evaluation:`);
        console.log(`Model Used: ${GPT_MODEL}`);
        console.log(`Number of Tool Calls: ${gptToolsUsed.length}`);
        console.log(`Tools Used: ${gptToolsUsed}`);
        console.log(`Tools Accuracy: ${gptToolsAccuracy}`);
        console.log(`Correct Result: ${gptOutputAccuracy}`);
        console.log(`Cost: $${gptCost}`);
    }

    await fs.writeFile('results/claude_results.json', JSON.stringify(claudeResults, null, 2));
    await fs.writeFile('results/gpt_results.json', JSON.stringify(gptResults, null, 2));
    console.log('Results saved to JSON files.');
}
main();
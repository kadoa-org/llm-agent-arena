const {Anthropic} = require('@anthropic-ai/sdk');
const OpenAI = require("openai");
const tools = require("./tools");
const Groq = require("groq-sdk");
const {VertexAI} = require("@google-cloud/vertexai");
const fs = require('fs').promises;
const tasks = require('./tasks');

const anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
});


const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

const groq = new Groq({apiKey: process.env.GROQ_API_KEY});


const CLAUDE_MODEL = "claude-3-opus-20240229"
const GPT_MODEL = "gpt-3.5-turbo-0125"
const GROQ_MODEL = "llama3-70b-8192"
const GEMINI_MODEL = "gemini-1.5-pro-preview-0514"

const costConfig = {
    'gpt-4-0125-preview': {
        inputCostPer1MTokens: 10.00,
        outputCostPer1MTokens: 30.00,
    },
    'gpt-4o': {
        inputCostPer1MTokens: 5.00,
        outputCostPer1MTokens: 15.00,
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
    'gemini-1.5-flash': {
        inputCostPer1MTokens: 0.125,
        outputCostPer1MTokens: 0.375,
    },
    'gemini-1.5-pro-preview-0514': {
        inputCostPer1MTokens: 1.25,
        outputCostPer1MTokens: 3.75,
    },
    'llama3-70b-8192': {
        inputCostPer1MTokens: 0.59,
        outputCostPer1MTokens: 0.79,
    },
    'mixtral-8x7b-32768': {
        inputCostPer1MTokens: 0.27,
        outputCostPer1MTokens: 0.27,
    },
    'llama3-8b-8192': {
        inputCostPer1MTokens: 0.05,
        outputCostPer1MTokens: 0.10,
    }
};


async function testClaude(testCase) {
    const results = []
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    let messages = [
        {
            "role": "user",
            "content": `${testCase.query}`
        }
    ];

    let response = await anthropic.messages.create(
        {
            max_tokens: 3024,
            model: CLAUDE_MODEL,
            tools: tools,
            messages: messages
        },
        {headers: {'anthropic-beta': 'tools-2024-05-16'}}
    );

    console.log(`\nInitial Response:`);
    console.log(`Stop Reason: ${response.stop_reason}`);
    console.log(`Content: ${JSON.stringify(response.content, null, 2)}`);

    while (response.stop_reason === "tool_use") {
        const toolUses = response.content.filter(block => block.type === "tool_use");
        const toolResultMessage = [];
        for (const toolUse of toolUses) {
            const toolName = toolUse.name;
            const toolInput = toolUse.input;
            totalInputTokens += response.usage.input_tokens;
            totalOutputTokens += response.usage.output_tokens;
            results.push(toolUse);

            const toolFunction = tools.find(tool => tool.name === toolName).function;
            const toolResult = await toolFunction(JSON.stringify(toolInput, null, 2));

            toolResultMessage.push(
                        {
                            "type": "tool_result",
                            "tool_use_id": toolUse.id,
                            "content": JSON.stringify(toolResult),
                        })
        }

        messages = [
            ...messages,
            {"role": "assistant", "content": response.content},
            {
                "role": "user",
                "content": toolResultMessage,
            },
        ];

        response = await anthropic.messages.create(
            {
                max_tokens: 3024,
                model: CLAUDE_MODEL,
                tools: tools,
                messages: messages
            },
            {headers: {'anthropic-beta': 'tools-2024-05-16'}}
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

async function testGroq(testCase) {
    const results = [];
    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    const messages = [
        {
            role: "system",
            content: "You are an RPA bot that uses the provided tools to automate browser and web scraping tasks.",
        },
        {
            role: "user",
            content: `${testCase.query}`,
        },
    ];

    const mappedTools = tools.map((tool) => ({
        type: "function",
        function: {
            name: tool.name,
            description: tool.description,
            parameters: tool.input_schema,
        },
    }));

    try {
        let response = await groq.chat.completions.create({
            model: GROQ_MODEL,
            messages: messages,
            tools: mappedTools,
            tool_choice: "auto"
        });
        console.log(`\nInitial Response:`);
        console.log(`Content: ${JSON.stringify(response.choices[0].message, null, 2)}`);

        while (response.choices[0].message.tool_calls) {
            const toolCalls = response.choices[0].message.tool_calls;
            totalInputTokens += response.usage.prompt_tokens;
            totalOutputTokens += response.usage.completion_tokens;

            for (const toolCall of toolCalls) {
                const toolName = toolCall.function.name;
                const toolInput = JSON.parse(toolCall.function.arguments);
                results.push({type: "tool_use", name: toolName, input: toolInput});

                const toolFunction = tools.find((tool) => tool.name === toolName).function;
                const toolResult = await toolFunction(JSON.stringify(toolInput, null, 2));

                messages.push({
                    tool_call_id: toolCall.id,
                    role: "tool",
                    name: toolName,
                    content: JSON.stringify(toolResult),
                });
            }

            response = await groq.chat.completions.create({
                model: GROQ_MODEL,
                messages: messages,
                tools: mappedTools,
                tool_choice: "auto"
            });

            console.log(`\nResponse:`);
            console.log(`Content: ${JSON.stringify(response.choices[0].message, null, 2)}`);
        }

        const finalResponse = response.choices[0].message.content;
        console.log(`\nFinal Response: ${finalResponse}`);
        results.push(finalResponse);

        const cost = calculateCost(GROQ_MODEL, totalInputTokens, totalOutputTokens);

        return {results, cost: cost.toFixed(6)};
    } catch (e) {
        console.log(e)
    }

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
            messages: [
                {
                    role: "system",
                    content: "You are an RPA bot that uses the provided tools to automate browser and web scraping tasks.",
                },
                {
                    role: 'user',
                    content: `${testCase.query}`
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

async function testGemini(
    testCase,
    projectId = process.env.GOOGLE_PROJECT_ID,
    location = 'us-central1',
    model = GEMINI_MODEL,
) {
    // Initialize Vertex with your Cloud project and location
    const vertexAI = new VertexAI({
        project: projectId,
        location: location,
        googleAuthOptions: {keyFilename: "application_default_credentials.json"}
    });
    const mappedTools = tools.map((tool) => ({
        name: tool.name,
        description: tool.description,
        parameters: {
            type: tool.input_schema.type.toUpperCase(),
            properties: Object.entries(tool.input_schema.properties).reduce((acc, [key, value]) => {
                acc[key] = {...value, type: value.type.toUpperCase()};
                return acc;
            }, {}),

        }
    }));
    const functionDeclarations = [
        {
            functionDeclarations: mappedTools,
        },
    ];
    const functionResponseParts = [];
    const results = [];

    // Instantiate the model
    const geminiModel = vertexAI.getGenerativeModel({
        model: model,
    });

    const request = {
        contents: [
            {role: 'user', parts: [{text: testCase.query}]},
        ],
        tools: functionDeclarations,
    };
    let result = await geminiModel.generateContent(request);
    const response = result.response;
    let functionCallPart = response.candidates[0].content.parts.find(part => part.functionCall);
    let functionCall = functionCallPart?.functionCall;
    let functionName = functionCall?.name;

    let totalInputTokens = 0;
    let totalOutputTokens = 0;

    while (functionName) {
        //while function calls, loop over it
        const toolFunction = tools.find((tool) => tool.name === functionName).function;
        const toolResult = await toolFunction(JSON.stringify(functionCall?.args, null, 2));
        results.push({type: "tool_use", name: functionName, input: functionCall?.args});
        if (functionName === testCase.expectedLastStep) {
            //sometimes Gemini went into an infinite loop and started the task over and over again, quite dangerous!
            break
        }
        functionResponseParts.push(
            {
                functionResponse: {
                    name: functionName,
                    response: {name: functionName, content: toolResult},
                },
            },
        );

        const req2 = {
            contents: [
                {role: 'user', parts: [{text: testCase.query}]},
                result.response.candidates[0].content,
                {role: 'user', parts: functionResponseParts},
            ],
            tools: functionDeclarations,
        };

        result = await geminiModel.generateContent(req2);
        console.log(result.response.candidates[0].content)
        functionCallPart = result.response.candidates[0].content.parts.find(part => part.functionCall);
        functionCall = functionCallPart?.functionCall;
        functionName = functionCall?.name;

        totalInputTokens += result.response.usageMetadata.promptTokenCount;
        totalOutputTokens += result.response.usageMetadata.candidatesTokenCount;

        console.log(response);
    }

    const finalResponse = result.response.candidates[0].content.parts.find(part => part.text)?.text;
    results.push(finalResponse);

    const cost = calculateCost(model, totalInputTokens, totalOutputTokens);
    return {results, cost: cost.toFixed(6)};
}

function calculateAccuracy(usedTools, expectedTools) {
    const correctTools = usedTools.filter(tool => expectedTools.includes(tool));
    return correctTools.length / expectedTools.length;
}

function calculateCost(modelName, inputTokens, outputTokens) {
    const {inputCostPer1MTokens, outputCostPer1MTokens} = costConfig[modelName];

    const inputCost = (inputTokens / 1000000) * inputCostPer1MTokens;
    const outputCost = (outputTokens / 1000000) * outputCostPer1MTokens;

    return inputCost + outputCost;
}

async function main() {
    const modelResults = {
        claude: [],
        gpt: [],
        groq: [],
        gemini: [],
    };

    for (const testCase of tasks) {
        console.log(`\n${'='.repeat(50)}\nTest Case: ${testCase.query}\n${'='.repeat(50)}`);

        const models = [
            {name: 'claude', test: testClaude, model: CLAUDE_MODEL},
            {name: 'groq', test: testGroq, model: GROQ_MODEL},
            {name: 'gpt', test: testGPT, model: GPT_MODEL},
            {name: 'gemini', test: testGemini, model: GEMINI_MODEL},
        ];

        for (const {name, test, model} of models) {
            const result = await test(testCase);
            modelResults[name].push(result.results);
            const cost = result.cost;

            let toolsUsed;
            if (name === "gpt") {
                toolsUsed = result.results.flatMap(message =>
                    message.tool_calls ? message.tool_calls.map(toolCall => toolCall.function.name) : []
                );
            } else {
                toolsUsed = result.results.filter(c => c && c.type === "tool_use").map(toolUse => toolUse.name);

            }
            const toolsAccuracy = calculateAccuracy(toolsUsed, testCase.expectedTools);
            const outputAccuracy = toolsUsed[toolsUsed.length - 1] === testCase.expectedLastStep;

            console.log(`\n${name.charAt(0).toUpperCase() + name.slice(1)} Evaluation:`);
            console.log(`Model Used: ${model}`);
            console.log(`Number of Tool Calls: ${toolsUsed.length}`);
            console.log(`Tools Used: ${toolsUsed}`);
            console.log(`Tools Accuracy: ${toolsAccuracy}`);
            console.log(`Correct Result: ${outputAccuracy}`);
            console.log(`Cost: $${cost}`);
        }
    }

    for (const [name, results] of Object.entries(modelResults)) {
        await fs.writeFile(`results/${name}_results.json`, JSON.stringify(results, null, 2));
    }
    console.log('Results saved to JSON files.');
}

main();
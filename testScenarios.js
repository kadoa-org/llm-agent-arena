module.exports = [
/*    {
        "query":
            "Answer the user's request using relevant tools (if they are available). Before calling a tool, do some analysis. First, think about which of the provided tools is the relevant tool to answer the user's request. Second, go through each of the required parameters of the relevant tool and determine if the user has directly provided or given enough information to infer a value. When deciding if the parameter can be inferred, carefully consider all the context to see if it supports a specific value. If all of the required parameters are present or can be reasonably inferred, close the thinking tag and proceed with the tool call. BUT, if one of the values for a required parameter is missing, DO NOT invoke the function (not even with fillers for the missing params) and instead, ask the user to provide the missing parameters. DO NOT ask for more information on optional parameters if it is not provided." +
            "Here is your task: " +
            "1.) Navigate to https://example.com/login. Params: {'username': 'root', 'PW': 'root'}" +
            "2.) Fill in the username and password fields with the provided credentials" +
            "3.) Click the login button. Params: {'description': 'login button'}" +
            "4.) After successful login, navigate to the user https://example.com/profile page. " +
            "5.) Extract the user's name, email, and profile picture URL from the profile page. Params: {'schema': {'username': string, 'email': string, 'profilePicture': string }}" +
            "6.) Finally, save the extracted user data to a JSON file and upload it to the file server. Don't call any other tools after this. You're finished." +
            "DONE",
        "expectedTools": [
            "navigate_to_url",
            "fill_form",
            "click_element",
            "navigate_to_url",
            "extract_profile_data",
            "upload_to_file_server"
        ],
        "expectedLastStep": "upload_to_file_server",
        "level": "easy"
    },*/
    {
        "query":
            "Answer the user's request using relevant tools (if they are available). Before calling a tool, do some analysis. First, think about which of the provided tools is the relevant tool to answer the user's request. Second, go through each of the required parameters of the relevant tool and determine if the user has directly provided or given enough information to infer a value. When deciding if the parameter can be inferred, carefully consider all the context to see if it supports a specific value. If all of the required parameters are present or can be reasonably inferred, close the thinking tag and proceed with the tool call. BUT, if one of the values for a required parameter is missing, DO NOT invoke the function (not even with fillers for the missing params) and instead, ask the user to provide the missing parameters. DO NOT ask for more information on optional parameters if it is not provided." +
            "Here is your task: " +
            "1.) Navigate to https://example.com/products" +
            "2.) Extract the names and prices of first product on the page. Params: {'schema': {'productName': string, 'price': string, 'link': string}}" +
            "3.) For each product, use the link to navigate to the details page" +
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
];
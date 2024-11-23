This is a single user application, meaning theres no login or user identification, the memory of the conversations is based on the complete history, to reset the memory we need to manually delete it for the application to forget that context.

This is a server application so I accomodated the code in a way that the response can be seen in the postman call for demonstration purposes, usually with this type of infrastructure we would use a websocket connection to send the response to the client and dont wait for the response on the same endpoint.

# Intent Detection Service

## Expect
- The huggingface model sometimes is slow to load.

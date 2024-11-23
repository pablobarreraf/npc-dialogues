-- GIT

1. I used the same main branch, tried to create the most amount of commits possible to show the different stages of the development.

This is a single user application, meaning theres no login or user identification, the memory of the conversations is based on the complete history, to reset the memory we need to manually delete it for the application to forget that context.

This is a server application so I accomodated the code in a way that the response can be seen in the postman call for demonstration purposes, usually with this type of infrastructure we would use a websocket connection to send the response to the client and dont wait for the response on the same endpoint.

Currently using pretrained models, but we can train our own model to improve the accuracy of the intent detection and dialogue generation. Will add memory to rehydrate the context of the conversation.

With enough GPU we could use our own trained model to improve the responses, latency and fine-tune the model to our needs and we would consume this model in the dialogue generation service.

Example of hosting our fined-tuned model based on DialoGPT:

```python
from transformers import AutoModelForCausalLM, AutoTokenizer
from fastapi import FastAPI, Request

app = FastAPI()

# Load the model and tokenizer
model_name = "microsoft/DialoGPT-medium"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

@app.post("/generate")
async def generate_response(request: Request):
data = await request.json()
input_text = data.get("input", "")

    # Tokenize input and generate response
    inputs = tokenizer.encode(input_text, return_tensors="pt")
    outputs = model.generate(inputs, max_length=150, pad_token_id=tokenizer.eos_token_id)
    response = tokenizer.decode(outputs[0], skip_special_tokens=True)

    return {"response": response}

// Fine-Tune the model

from transformers import AutoTokenizer, AutoModelForCausalLM, Trainer, TrainingArguments

# Load model and tokenizer
model_name = "microsoft/DialoGPT-medium"
tokenizer = AutoTokenizer.from_pretrained(model_name)
model = AutoModelForCausalLM.from_pretrained(model_name)

# Prepare dataset
from datasets import load_dataset
dataset = load_dataset("json", data_files="new_dialogues.json")

# Tokenize dataset
def preprocess_function(examples):
    return tokenizer(examples["input"], text_pair=examples["response"], truncation=True)

tokenized_dataset = dataset.map(preprocess_function, batched=True)

# Fine-tune model
training_args = TrainingArguments(
    output_dir="./fine_tuned_model",
    num_train_epochs=3,
    per_device_train_batch_size=4,
    save_steps=10_000,
    save_total_limit=2,
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized_dataset["train"],
)

trainer.train()

# Save fine-tuned model
model.save_pretrained("./fine_tuned_model")
tokenizer.save_pretrained("./fine_tuned_model")

# Save feedback
@app.post("/feedback")
async def feedback(request: Request):
    data = await request.json()
    user_input = data.get("input", "")
    model_response = data.get("response", "")
    feedback = data.get("feedback", "")  # e.g., "positive" or "negative"

    # Save feedback for training
    with open("feedback_log.json", "a") as f:
        f.write(json.dumps({
            "input": user_input,
            "response": model_response,
            "feedback": feedback
        }) + "\n")

    return {"message": "Feedback received"}


Was unsure if I should create a separate service for the memory with Redis, I kept it in the dialogue service for practicity.

# Intent Detection Service

## Expect

- The huggingface model sometimes is slow to load.
```

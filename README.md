# **Interactive Dialogue System**

## **General Overview**

- **Single User Context**:

  - This is a single-user application with no login or user identification.
  - The conversation memory is based on the complete history of interactions.
  - Resetting memory requires manually deleting the stored memory.

- **Infrastructure**:

  - This is a server-based application designed for demonstration through Postman.
  - Typically, such systems would use a WebSocket connection to handle asynchronous responses instead of waiting on the same endpoint.

- **Pretrained Models**:
  - The system uses pretrained models (like Hugging Face's `DialoGPT-medium` or `Falcon`) for intent detection and dialogue generation.
  - Future iterations could fine-tune these models to improve accuracy, reduce latency, and better align with specific application needs.

---

## **Infrastructure Design and Flow**

### **Components**

1. **Intent Detection Service**:

   - Uses a Hugging Face model for intent detection.
   - Processes the user input, identifies the intent, and publishes the event to Kafka (`intent-topic`) with a correlation ID.
   - Awaits the dialogue generation response via Kafka (`dialogue-response-topic`) and returns it to the client.

2. **Dialogue Generation Service**:

   - Listens to Kafka (`intent-topic`) for new messages.
   - Generates responses based on the detected intent using a Hugging Face model.
   - Maintains conversation memory in Redis to rehydrate context.
   - Publishes the response to Kafka (`dialogue-response-topic`) for consumption by the intent service.

3. **Redis**:

   - Stores and retrieves conversation memory for context-aware dialogue generation.

4. **Kafka**:
   - Facilitates asynchronous communication between the services (`intent-topic` and `dialogue-response-topic`).

---

### **Flow**

1. **Input Handling**:

   - User sends input via the `/intent` endpoint.
   - The intent detection service preprocesses input and determines intent.

2. **Kafka Event**:

   - Publishes an event to Kafka containing the input, detected intent, and correlation ID.

3. **Dialogue Generation**:

   - Dialogue generation service receives the Kafka event, generates a response using context-aware memory, and publishes it back to Kafka.

4. **Response Handling**:
   - The intent detection service consumes the response and sends it back to the client.

---

## **Steps to Run the Application**

1. **Clone the Repository**:
   ```bash
   git clone <repository_url>
   cd <repository_directory>
   ```
2. **Start the Services**:

   - Use Docker to build and start the infrastructure:

   ```bash
   docker-compose up --build
   ```

   -This will start:

   - Redis
   - Kafka (along with Zookeeper)
   - Intent Detection Service
   - Dialogue Generation Service

3. **Verify Services**:

   - Ensure all containers are running:

   ```bash
   docker ps
   ```

   Set Environment Variables:

   - Add the following to a .env file:

   ```env
   HUGGINGFACE_API_KEY=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
   KAFKA_BROKER=kafka:9092
   REDIS_URL=redis://redis:6379
   ```

4. **Test the Application**:

   - Use Postman or any API client to test the /intent endpoint.

   - Endpoint: http://localhost:3000/intent
   - Method: POST
   - Body:

   ```json
   {
     "input": "What swords do you sell?"
   }
   ```

   - Example response:

   ```json
   {
     "message": "Response from dialogue service",
     "intent": "general",
     "dialogue": "We have steel, silver, and dragon swords available. Which one would you like to know more about?"
   }
   ```

## **Improvements**

### **Enhanced Memory Management**

- Use **Redis** for scalable, distributed memory to handle conversation context efficiently.
- Implement intelligent memory decay or pruning for old conversations to avoid overloading prompts.

### **Custom Fine-Tuned Models**

- Fine-tune models like `DialoGPT` on domain-specific data for better accuracy and responses aligned with the application's theme (e.g., medieval fantasy RPG).

### **WebSocket Support**

- Replace the synchronous response mechanism with WebSocket connections for real-time dialogue updates, enhancing user experience.

### **Multi-User Support**

- Transition the system to a multi-user application by introducing user session IDs and isolating memory contexts per user.

---

## **Potential Limitations**

### **Model Latency**

- Hugging Face models can be slow to load initially.
- Mitigate this by keeping models warm or hosting them on a dedicated server with GPU support.

### **Prompt Size**

- Large memory contexts can exceed model input limits.
- Address this by summarizing or limiting the memory added to the prompt.

### **Single User Design**

- This infrastructure assumes a single user. For production-grade applications, multi-user support will be necessary.

---

## **Additional Notes**

### **Hosting Fine-Tuned Models**

- With sufficient GPU resources, hosting fine-tuned models would allow tighter control over responses, reduced latency, and alignment with application needs.
- The application supports pretraining feedback loops to improve responses dynamically by incorporating user-provided feedback.

### **Feedback Collection**

- Implement a `/feedback` endpoint to gather user feedback on generated responses.
- This feedback can be used for further fine-tuning and improving the system.

### **Memory Scenarios**

- Includes short-term memory for current conversations and long-term memory for key contextual elements (e.g., preferences or frequently asked questions).

---

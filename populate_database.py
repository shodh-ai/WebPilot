import requests
import json
import time
import random

# Base URL for API endpoints
BASE_URL = "http://localhost:8000/api"

# Test data for users
users = [
    {
        "email": "john.doe@example.com",
        "password": "Password123!",
        "name": "John Doe"
    },
    {
        "email": "jane.smith@example.com",
        "password": "SecurePass456!",
        "name": "Jane Smith"
    },
    {
        "email": "michael.johnson@example.com",
        "password": "MJohnson789!",
        "name": "Michael Johnson"
    },
    {
        "email": "sarah.williams@example.com",
        "password": "Williams2024!",
        "name": "Sarah Williams"
    }
]

# Post topics and templates
post_topics = [
    "AI Technology Trends",
    "Web Development Best Practices",
    "Data Privacy in Modern Applications",
    "User Experience Design"
]

post_templates = [
    {
        "title": "Understanding {topic} in 2025",
        "content": "In this comprehensive guide to {topic}, we explore the latest advancements and how they're reshaping our digital landscape. From recent innovations to practical applications, this post covers everything you need to know about {content_detail}."
    },
    {
        "title": "10 Ways {topic} Is Changing Business",
        "content": "Businesses around the world are adapting to new realities brought by {topic}. This post examines ten significant ways these changes are impacting operations, customer engagement, and future growth. Particularly interesting is how {content_detail}."
    },
    {
        "title": "Beginner's Guide to {topic}",
        "content": "New to {topic}? This introductory guide breaks down complex concepts into easy-to-understand explanations. We'll walk through fundamental principles and provide practical starting points for implementing {content_detail} in your projects."
    },
    {
        "title": "The Future of {topic}: Predictions for 2026",
        "content": "What does the future hold for {topic}? Based on current trends and expert insights, we predict major developments in this space over the next year. Pay special attention to our analysis of {content_detail} and its potential impact."
    }
]

# Content details for each topic
topic_content_details = {
    "AI Technology Trends": [
        "large language models and their enterprise applications",
        "computer vision advancements in healthcare diagnostics",
        "autonomous systems for manufacturing optimization",
        "AI ethics and governance frameworks",
        "multimodal AI interfaces for everyday users",
        "edge AI implementations in IoT environments",
        "generative design in architectural planning",
        "AI-powered predictive maintenance solutions",
        "natural language processing for customer service automation",
        "reinforcement learning in complex decision making"
    ],
    "Web Development Best Practices": [
        "modern state management approaches in React applications",
        "server components and their performance implications",
        "accessibility implementation for diverse user needs",
        "full-stack TypeScript architectures",
        "microfrontend strategies for enterprise applications",
        "headless CMS integration patterns",
        "responsive design principles for multi-device experiences",
        "API design and versioning strategies",
        "performance optimization techniques for complex web apps",
        "authentication and authorization best practices"
    ],
    "Data Privacy in Modern Applications": [
        "GDPR compliance strategies for global companies",
        "privacy-by-design implementation approaches",
        "data anonymization techniques for analytics",
        "cookie consent management in contemporary websites",
        "data portability implementation models",
        "user data rights management systems",
        "privacy impact assessment frameworks",
        "data retention policies and automation",
        "cross-border data transfer compliance",
        "privacy training programs for development teams"
    ],
    "User Experience Design": [
        "usability testing methodologies for diverse user groups",
        "information architecture for complex web applications",
        "motion design principles for enhanced engagement",
        "dark mode implementation considerations",
        "internationalization and localization best practices",
        "voice user interface design approaches",
        "microinteractions for improved user feedback",
        "inclusive design beyond accessibility minimums",
        "design systems management for distributed teams",
        "measuring and optimizing for user satisfaction metrics"
    ]
}

# Query templates
query_templates = [
    "I need help understanding how to implement {topic} in my project. Can you provide some guidance?",
    "What are the best resources to learn about {topic} for a beginner?",
    "I'm experiencing an issue with {topic} where {issue_detail}. Any suggestions?",
    "How does {topic} compare to {alternative} in terms of performance and usability?",
    "Can you explain the technical details behind {topic} and how it works?",
    "I'm looking for examples of {topic} implementation in real-world scenarios.",
    "What are the security implications of using {topic} in a production environment?",
    "Is {topic} suitable for my use case where I need to {use_case_detail}?",
    "What's the future outlook for {topic} in the next 2-3 years?",
    "Can you recommend a testing strategy for applications that use {topic}?"
]

# Query topics
query_topics = [
    "Supabase authentication",
    "Next.js server components",
    "Tailwind CSS customization",
    "AI integration with web applications",
    "GraphQL API design",
    "PostgreSQL performance tuning",
    "React state management",
    "Serverless architecture",
    "TypeScript configuration",
    "WebSockets for real-time features"
]

# Issue details for queries
issue_details = [
    "the authentication flow fails intermittently",
    "data fetching is slower than expected",
    "the UI doesn't adapt properly to mobile devices",
    "memory usage increases unexpectedly over time",
    "API requests are randomly rejected with 403 errors",
    "CSS styling is inconsistent across browsers",
    "user sessions expire too quickly",
    "database queries time out for large datasets",
    "the application crashes when processing certain inputs",
    "file uploads fail for files larger than 5MB"
]

# Use case details
use_case_details = [
    "process large amounts of user-generated content",
    "support thousands of concurrent users",
    "maintain sub-second response times",
    "ensure compliance with financial regulations",
    "provide offline functionality",
    "handle sensitive personal information",
    "integrate with legacy enterprise systems",
    "support multi-language content",
    "operate in low-bandwidth environments",
    "scale dynamically based on demand"
]

# Alternatives for comparison queries
alternatives = [
    "traditional REST APIs",
    "custom CSS",
    "server-side rendering",
    "manual data processing",
    "relational databases",
    "monolithic architecture",
    "vanilla JavaScript",
    "on-premises solutions",
    "client-side processing",
    "third-party frameworks"
]

# Message templates for conversations
message_templates = [
    "Hi, I have a question about {topic}. {question_detail}",
    "Thanks for your response. Can you elaborate more on {topic_detail}?",
    "I'm trying to understand how {topic} works in the context of {context}.",
    "That makes sense. So if I want to implement {topic}, I should start with {approach}?",
    "I appreciate the help! One more question - what about {follow_up_topic}?",
    "Perfect, this clears things up. I'll try implementing your suggestions.",
    "I'm running into an issue with {topic} where {issue_detail}. Any thoughts?",
    "I see, so the problem is related to {root_cause}. How can I fix that?",
    "Great explanation. Do you have any resources you'd recommend for learning more about {topic}?",
    "Thanks again for all your help with {topic}. This has been very insightful."
]

# Topic details for messages
topic_details = [
    "specifically the authentication flow for social logins",
    "the performance implications of this approach",
    "how to implement proper error handling",
    "the security considerations to keep in mind",
    "best practices for testing this functionality",
    "how to ensure it's accessible to all users",
    "ways to optimize it for mobile devices",
    "how to handle edge cases gracefully",
    "the scalability aspects of this solution",
    "maintenance considerations for long-term projects"
]

# Contexts for messages
contexts = [
    "a high-traffic e-commerce application",
    "a financial services platform",
    "an educational technology solution",
    "a healthcare management system",
    "a content management platform",
    "a real-time collaboration tool",
    "a mobile-first progressive web app",
    "an enterprise resource planning system",
    "a social media platform",
    "an IoT device management dashboard"
]

# Implementation approaches
approaches = [
    "setting up the proper data models and relationships",
    "implementing the authentication and authorization flows",
    "designing a responsive and accessible user interface",
    "establishing proper API contracts between components",
    "setting up a comprehensive testing strategy",
    "implementing proper error handling and logging",
    "optimizing database queries and indexing",
    "setting up a CI/CD pipeline for reliable deployments",
    "implementing proper caching strategies",
    "establishing monitoring and alerting"
]

# Follow-up topics
follow_up_topics = [
    "handling error states and edge cases",
    "performance optimization for scale",
    "security best practices for this approach",
    "accessibility considerations",
    "internationalization and localization",
    "mobile responsiveness",
    "offline functionality",
    "analytics and user behavior tracking",
    "A/B testing implementation",
    "compliance with relevant regulations"
]

# Root causes for issues
root_causes = [
    "incorrect configuration settings",
    "missing dependencies or version conflicts",
    "incorrect data model relationships",
    "insufficient error handling",
    "browser compatibility issues",
    "performance bottlenecks in the database",
    "network latency or timeout settings",
    "insufficient input validation",
    "memory leaks in the client application",
    "incompatible API contract versions"
]

# Departments for queries
departments = ["Technical Support", "Development", "Customer Success", "Product Management"]

# --- Helper functions ---

def generate_posts():
    """Generate meaningful post data"""
    posts = []
    
    for topic in post_topics:
        for template in post_templates:
            content_detail = random.choice(topic_content_details[topic])
            title = template["title"].format(topic=topic)
            content = template["content"].format(topic=topic, content_detail=content_detail)
            
            posts.append({
                "title": title,
                "content": content,
                "topic": topic
            })
    
    # Add a few more random posts to reach desired count
    while len(posts) < 35:
        topic = random.choice(post_topics)
        template = random.choice(post_templates)
        content_detail = random.choice(topic_content_details[topic])
        title = template["title"].format(topic=topic)
        content = template["content"].format(topic=topic, content_detail=content_detail)
        
        posts.append({
            "title": title,
            "content": content,
            "topic": topic
        })
    
    return posts

def generate_queries():
    """Generate meaningful query data"""
    queries = []
    
    for i in range(12):
        topic = random.choice(query_topics)
        template = random.choice(query_templates)
        
        if "{issue_detail}" in template:
            text = template.format(topic=topic, issue_detail=random.choice(issue_details))
        elif "{use_case_detail}" in template:
            text = template.format(topic=topic, use_case_detail=random.choice(use_case_details))
        elif "{alternative}" in template:
            text = template.format(topic=topic, alternative=random.choice(alternatives))
        else:
            text = template.format(topic=topic)
        
        queries.append({
            "text": text,
            "department": random.choice(departments),
            "user_mail": ""  # Will be set during execution
        })
    
    return queries

def generate_message_pairs():
    """Generate pairs of messages (conversations)"""
    message_pairs = []
    
    for i in range(12):
        topic = random.choice(query_topics)
        
        # First message in conversation
        initial_template = message_templates[0]
        question_detail = f"I'm wondering about {random.choice(topic_details).replace('specifically', '')}"
        initial_message = initial_template.format(topic=topic, question_detail=question_detail)
        
        # Response message
        response_idx = random.randint(1, len(message_templates) - 1)
        response_template = message_templates[response_idx]
        
        if "{topic_detail}" in response_template:
            response = response_template.format(topic_detail=random.choice(topic_details))
        elif "{context}" in response_template:
            response = response_template.format(topic=topic, context=random.choice(contexts))
        elif "{approach}" in response_template:
            response = response_template.format(topic=topic, approach=random.choice(approaches))
        elif "{follow_up_topic}" in response_template:
            response = response_template.format(follow_up_topic=random.choice(follow_up_topics))
        elif "{issue_detail}" in response_template:
            response = response_template.format(topic=topic, issue_detail=random.choice(issue_details))
        elif "{root_cause}" in response_template:
            response = response_template.format(root_cause=random.choice(root_causes))
        else:
            response = response_template.format(topic=topic)
        
        message_pairs.append((initial_message, response))
    
    return message_pairs

# --- Main execution function ---

def extract_user_id_from_response(response_text):
    """Extract user ID from various response formats"""
    try:
        data = json.loads(response_text)
        
        # Check different possible locations for the user ID
        if 'user' in data and 'user_id' in data['user']:
            return data['user']['user_id']
        elif 'userId' in data:
            return data['userId']
        elif 'user_id' in data:
            return data['user_id']
        elif 'user' in data and 'id' in data['user']:
            return data['user']['id']
        elif 'id' in data:
            return data['id']
        
        # If none of the above, try to find any key that might contain 'id' in the user object
        if 'user' in data:
            for key in data['user']:
                if 'id' in key.lower():
                    return data['user'][key]
                
        print(f"Could not find user ID in response: {data}")
        return None
    except json.JSONDecodeError:
        print(f"Could not parse JSON response: {response_text}")
        return None

def populate_database():
    """Populate the database with test data"""
    print("Starting database population...")
    
    # --- Create users ---
    user_ids = []
    print("\nCreating users...")
    
    # Define endpoint URLs based on your API
    signup_url = f"{BASE_URL}/auth/signup"
    login_url = f"{BASE_URL}/auth/login"
    
    for user in users:
        try:
            # Sign up user
            print(f"Signing up user {user['email']}...")
            
            # This assumes your signup endpoint accepts email, password, and name
            signup_response = requests.post(signup_url, json={
                "email": user["email"],
                "password": user["password"],
                "name": user.get("name", "")
            })
            
            user_id = None
            
            # Check if the response indicates success (could be 200, 201, etc.)
            if signup_response.status_code >= 200 and signup_response.status_code < 300:
                print(f"Successfully signed up user {user['email']}")
                user_id = extract_user_id_from_response(signup_response.text)
            else:
                # If signup failed due to user already existing, try to login
                print(f"Sign up failed or user exists, trying to login {user['email']}...")
                login_response = requests.post(login_url, json={
                    "email": user["email"],
                    "password": user["password"]
                })
                
                if login_response.status_code >= 200 and login_response.status_code < 300:
                    print(f"Successfully logged in user {user['email']}")
                    user_id = extract_user_id_from_response(login_response.text)
                else:
                    print(f"Failed to login user {user['email']}: {login_response.text}")
            
            # If we have a user_id, add it to our list
            if user_id:
                user_ids.append({
                    "id": user_id,
                    "email": user["email"]
                })
                print(f"User ID for {user['email']}: {user_id}")
            
        except Exception as e:
            print(f"Error processing user {user['email']}: {str(e)}")
    
    if not user_ids:
        print("No users created or found. Exiting...")
        return
    
    print(f"Created/found {len(user_ids)} users")
    
    # --- Create posts ---
    posts = generate_posts()
    print(f"\nCreating {len(posts)} posts...")
    
    for post in posts:
        try:
            user = random.choice(user_ids)
            
            create_post_url = f"{BASE_URL}/posts/add_post"
            post_data = {
                "title": post["title"],
                "content": post["content"],
                "user_id": user["id"]
            }
            
            response = requests.post(create_post_url, json=post_data)
            
            if response.status_code >= 200 and response.status_code < 300:
                print(f"Created post: {post['title'][:30]}...")
            else:
                print(f"Failed to create post: {response.text}")
            
            # Add a small delay to prevent overwhelming the server
            time.sleep(0.2)
            
        except Exception as e:
            print(f"Error creating post: {str(e)}")
    
    # --- Create queries ---
    queries = generate_queries()
    print(f"\nCreating {len(queries)} queries...")
    
    for query in queries:
        try:
            user = random.choice(user_ids)
            query["user_mail"] = user["email"]
            
            response = requests.post(f"{BASE_URL}/query/add_query", json={
                "text": query["text"],
                "department": query["department"],
                "email": query["user_mail"]
            })
            
            if response.status_code >= 200 and response.status_code < 300:
                print(f"Created query for {query['department']}")
            else:
                print(f"Failed to create query: {response.text}")
            
            # Add a small delay
            time.sleep(0.2)
            
        except Exception as e:
            print(f"Error creating query: {str(e)}")
    
    # --- Create messages ---
    message_pairs = generate_message_pairs()
    print(f"\nCreating message conversations...")
    
    for i, (initial_msg, response_msg) in enumerate(message_pairs):
        try:
            # Select random sender and receiver
            sender = random.choice(user_ids)
            receiver = random.choice([u for u in user_ids if u["id"] != sender["id"]])
            
            # Send initial message
            send_msg_response = requests.post(f"{BASE_URL}/messages/send", json={
                "sender_id": sender["id"],
                "receiver_id": receiver["id"],
                "content": initial_msg
            })
            
            if send_msg_response.status_code >= 200 and send_msg_response.status_code < 300:
                print(f"Sent message from {sender['email']} to {receiver['email']}")
                
                # Send response message (role reversal)
                response = requests.post(f"{BASE_URL}/messages/send", json={
                    "sender_id": receiver["id"],
                    "receiver_id": sender["id"],
                    "content": response_msg
                })
                
                if response.status_code >= 200 and response.status_code < 300:
                    print(f"Sent response message from {receiver['email']} to {sender['email']}")
                else:
                    print(f"Failed to send response message: {response.text}")
            else:
                print(f"Failed to send initial message: {send_msg_response.text}")
            
            # Add a small delay
            time.sleep(0.3)
            
        except Exception as e:
            print(f"Error creating message conversation: {str(e)}")
    
    print("\nDatabase population complete!")

if __name__ == "__main__":
    populate_database()
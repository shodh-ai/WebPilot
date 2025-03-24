-- Users Table
CREATE TABLE "User" (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    mail VARCHAR NOT NULL UNIQUE,
    pass VARCHAR NOT NULL
);

-- Messages Table
CREATE TABLE "Message" (
    id BIGSERIAL PRIMARY KEY,
    message_id UUID UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    message TEXT NOT NULL,
    seen BOOLEAN DEFAULT FALSE
);

-- Message-User Linking Table
CREATE TABLE "message-user" (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sender UUID NOT NULL,
    receiver UUID NOT NULL,
    message UUID NOT NULL,
    FOREIGN KEY (sender) REFERENCES "User"(user_id) ON DELETE CASCADE,
    FOREIGN KEY (receiver) REFERENCES "User"(user_id) ON DELETE CASCADE,
    FOREIGN KEY (message) REFERENCES "Message"(message_id) ON DELETE CASCADE
);

-- Queries Table
CREATE TABLE "Query" (
    id BIGSERIAL PRIMARY KEY,
    query_id UUID UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    text TEXT NOT NULL,
    department TEXT NOT NULL,
    user_mail TEXT NOT NULL
);

-- Query-User Linking Table
CREATE TABLE "query-user" (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user UUID NOT NULL,
    query UUID NOT NULL,
    FOREIGN KEY (user) REFERENCES "User"(user_id) ON DELETE CASCADE,
    FOREIGN KEY (query) REFERENCES "Query"(query_id) ON DELETE CASCADE
);

-- Posts Table
CREATE TABLE "Posts" (
    id BIGSERIAL PRIMARY KEY,
    post_id UUID UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    Title VARCHAR NOT NULL,
    Content TEXT NOT NULL
);

-- Post-User Linking Table
CREATE TABLE "post-user" (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    post UUID NOT NULL,
    user UUID NOT NULL,
    FOREIGN KEY (post) REFERENCES "Posts"(post_id) ON DELETE CASCADE,
    FOREIGN KEY (user) REFERENCES "User"(user_id) ON DELETE CASCADE
);

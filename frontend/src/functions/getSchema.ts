export function getDBSchema(): string {
  const schema = [
    {
      table: "User",
      columns: [
        { name: "user_id", type: "uuid", foreignKey: null },
        { name: "created_at", type: "datetime", foreignKey: null },
        { name: "email", type: "varchar", foreignKey: null }
      ]
    },
    {
      table: "Message",
      columns: [
        { name: "message_id", type: "uuid", foreignKey: null },
        { name: "created_at", type: "datetime", foreignKey: null },
        { name: "message", type: "text", foreignKey: null },
        { name: "seen", type: "boolean", foreignKey: null },
      ]
    },
    {
      table: "message-user",
      columns: [
        { name: "created_at", type: "datetime", foreignKey: null },
        { name: "sender", type: "uuid", foreignKey: "User.user_id" },
        { name: "reciver", type: "uuid", foreignKey: "User.user_id" },
        { name: "message", type: "uuid", foreignKey: "Message.message_id" }
      ]
    },
    {
      table: "Query",
      columns: [
        { name: "query_id", type: "uuid", foreignKey: null },
        { name: "created_at", type: "datetime", foreignKey: null },
        { name: "text", type: "text", foreignKey: null },
        { name: "department", type: "text", foreignKey: null },
        { name: "user_mail", type: "text", foreignKey: null }
      ]
    },
    {
      table: "query-user",
      columns: [
        { name: "created_at", type: "datetime", foreignKey: null },
        { name: "user", type: "uuid", foreignKey: "User.user_id" },
        { name: "query", type: "uuid", foreignKey: "Query.query_id" }
      ]
    },
    {
      table: "Posts",
      columns: [
        { name: "post_id", type: "uuid", foreignKey: null },
        { name: "created_at", type: "datetime", foreignKey: null },
        { name: "Title", type: "varchar", foreignKey: null },
        { name: "Content", type: "text", foreignKey: null }
      ]
    },
    {
      table: "post-user",
      columns: [
        { name: "created_at", type: "datetime", foreignKey: null },
        { name: "post", type: "uuid", foreignKey: "Posts.post_id" },
        { name: "user", type: "uuid", foreignKey: "User.user_id" }
      ]
    }
  ]
  return JSON.stringify(schema);
}

export default getDBSchema;

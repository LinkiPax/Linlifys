const { gql } = require("apollo-server-express");

const typeDefs = gql`
  type Message {
    _id: ID!
    senderId: String!
    receiverId: String!
    content: String!
    createdAt: String!
  }

  type Query {
    getMessages(userId: String!, targetUserId: String!): [Message]
  }

  type Mutation {
    sendMessage(senderId: String!, receiverId: String!, content: String!): Message
  }
`;

const resolvers = {
  Query: {
    getMessages: async (_, { userId, targetUserId }) => {
      const Message = mongoose.model("Message");
      return await Message.find({
        $or: [
          { senderId: userId, receiverId: targetUserId },
          { senderId: targetUserId, receiverId: userId },
        ],
      });
    },
  },
  Mutation: {
    sendMessage: async (_, { senderId, receiverId, content }) => {
      const Message = mongoose.model("Message");
      const newMessage = new Message({ senderId, receiverId, content });
      await newMessage.save();
      return newMessage;
    },
  },
};

module.exports = { typeDefs, resolvers };

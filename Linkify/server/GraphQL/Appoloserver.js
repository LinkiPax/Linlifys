const { ApolloServer } = require("apollo-server-express");
const { typeDefs, resolvers } = require("./messageschema");

const apolloServer = new ApolloServer({
    typeDefs,
    resolvers,
    context: ({ req }) => ({ io }),
  });
apolloServer.applyMiddleware({ app });

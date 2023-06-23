import { ApolloClient, ApolloLink, InMemoryCache, concat, createHttpLink, from } from "@apollo/client/core";

const cache = new InMemoryCache()

const authMiddleware = new ApolloLink((operation, forward) => {
  // add the authorization to the headers
  operation.setContext({
    headers: {
      'x-api-key': process.env.VUE_APP_X_API_KEY
    },
  });
  return forward(operation);
});

const requestTimeLink = new ApolloLink((operation, forward) => {
  // Called before operation is sent to server
  console.log(`running: `, operation.operationName)

  return forward(operation).map((data) => {
    return data;
  });
});

const httpLink = createHttpLink({
  uri: process.env.VUE_APP_GRAPHQL_URL,
  fetch,
});

export const apolloClient = new ApolloClient({
  cache,
  link: from([authMiddleware, requestTimeLink, concat(authMiddleware, httpLink)])
})
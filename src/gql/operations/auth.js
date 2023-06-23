import { gql } from "@apollo/client/core";

// ad8a400d-105e-4c46-8b7d-c7bbd5da4ed0 projectId
export const GET_USER_WALLET = gql`
  query getUsersWallet($email: String!, $projectId: ID!) {
    res: getUsersWallet(email: $email, projectId: $projectId)
  }
`

export const SIGN_TYPED_DATA = gql`
  query signTypedData($email: String!, $projectId: ID!, $valueTypes: String!, $domain: String!, $values: String!) {
    res: getUserEip712Signature(
      projectId: $projectId,
      email: $email,
      domain: $domain,
      valueTypes: $valueTypes,
      values: $values
    )
}
`
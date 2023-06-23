import { apolloClient } from "@/apollo"
import { GET_USER_WALLET, SIGN_TYPED_DATA } from "../operations/auth"

export const fetchUserWallet = async (email) => {
  try {
    const projectId = process.env.VUE_APP_WC_PROJECT_ID
    const res = await apolloClient.query({
      query: GET_USER_WALLET,
      variables: {
        email,
        projectId
      }
    })

    return res
  } catch (error) {
    console.error(error)
    return null
  }
}

export const signTypedData = async ({ types, domain, message, email }) => {
  try {
    const projectId = process.env.VUE_APP_WC_PROJECT_ID
    const stringDomain = JSON.stringify(domain)
    const stringMessage = JSON.stringify(message)
    const stringTypes = JSON.stringify(types)

    const res = await apolloClient.query({
      query: SIGN_TYPED_DATA,
      variables: {
        email,
        projectId,
        valueTypes: stringTypes,
        domain: stringDomain,
        values: stringMessage
      }
    })

    return res
  } catch (error) {
    throw new Error(error)
  }
}
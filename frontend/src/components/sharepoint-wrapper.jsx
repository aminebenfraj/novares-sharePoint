"use client"

import { useParams } from "react-router-dom"
import SharePointDetail from "./sharepoint-detail-enhanced"

export default function SharePointWrapper(props) {
  const params = useParams()
  const documentId = params.id

  return <SharePointDetail id={documentId} {...props} />
}

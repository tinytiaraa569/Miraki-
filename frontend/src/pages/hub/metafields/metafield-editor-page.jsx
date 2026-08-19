"use client"

import { useParams } from "react-router-dom"
import { MetafieldEditor } from "@/components/hub/metafields/metafield-editor"

/**
 * Route wrapper for the full-page metafield editor. `/new` mounts create mode;
 * `/:id/edit` mounts edit mode (detail is fetched lazily inside the editor).
 */
export default function HubMetafieldEditorPage() {
  const { id } = useParams()
  const mode = id ? "edit" : "create"
  return <MetafieldEditor key={id ?? "create"} mode={mode} metafieldId={id} />
}

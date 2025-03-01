import { getTemporaryAccessToken } from "@/actions/getTemporaryAccessToken";
import SchematicEmbed from "./SchemeticEmbed";

async function SchematicComponent({ componentId }: { componentId: string }) {
  if (!componentId) {
    return null;
  }

  //GET ACCESS TOKEN
  const accessToken = await getTemporaryAccessToken();

  if (!accessToken) {
    return new Error("Could not get access token");
  }

  return <SchematicEmbed accessToken={accessToken} componentId={componentId} />;
}
export default SchematicComponent;

import { permanentRedirect } from "next/navigation";

export default function TermsAlias() {
  permanentRedirect("/terms-of-service");
}

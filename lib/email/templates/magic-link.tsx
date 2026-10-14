import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";

// Based on the React Email "Raycast magic link" template (MIT): logo, one big
// headline, one obvious button, a plain fallback link and a quiet footer.
// Restyled with the app's warm palette; table-safe inline styles only.

export type MagicLinkEmailProps = {
  appName: string;
  appUrl: string;
  url: string;
  copy: {
    preview: string;
    heading: string;
    body: string;
    button: string;
    validity: string;
    fallback: string;
    ignore: string;
    footer: string;
  };
};

const ink = "#1f2630";
const muted = "#66707c";
const primary = "#5b80ad";

export function MagicLinkEmail({
  appName,
  appUrl,
  url,
  copy,
}: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{copy.preview}</Preview>
      <Body
        style={{
          backgroundColor: "#edf1f7",
          margin: 0,
          padding: "32px 12px",
          fontFamily:
            "-apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif",
        }}
      >
        <Container
          style={{
            maxWidth: 480,
            margin: "0 auto",
            backgroundColor: "#fbfcfe",
            borderRadius: 24,
            border: "1px solid #dbe3ee",
            padding: "40px 36px 32px",
          }}
        >
          <Img
            src={`${appUrl}/brand/email-logo.png`}
            width={44}
            height={44}
            alt={appName}
            style={{ display: "block" }}
          />
          <Heading
            style={{
              color: ink,
              fontSize: 28,
              lineHeight: "34px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              margin: "28px 0 12px",
            }}
          >
            {copy.heading}
          </Heading>
          <Text
            style={{
              color: "#3c4552",
              fontSize: 16,
              lineHeight: "26px",
              margin: 0,
            }}
          >
            {copy.body}
          </Text>

          <Section style={{ margin: "28px 0 10px" }}>
            <Button
              href={url}
              style={{
                backgroundColor: primary,
                color: "#ffffff",
                fontSize: 16,
                fontWeight: 700,
                padding: "15px 28px",
                borderRadius: 999,
                boxShadow: "0 10px 24px -10px rgba(96,128,168,0.8)",
              }}
            >
              {copy.button}
            </Button>
          </Section>
          <Text style={{ color: muted, fontSize: 13, margin: "0 0 24px" }}>
            {copy.validity}
          </Text>

          <Text
            style={{
              color: muted,
              fontSize: 13,
              lineHeight: "20px",
              margin: 0,
            }}
          >
            {copy.fallback}
          </Text>
          <Link
            href={url}
            style={{
              color: primary,
              fontSize: 12,
              lineHeight: "18px",
              wordBreak: "break-all",
            }}
          >
            {url}
          </Link>

          <Hr style={{ borderColor: "#dbe3ee", margin: "28px 0 20px" }} />
          <Text
            style={{
              color: muted,
              fontSize: 13,
              lineHeight: "20px",
              margin: 0,
            }}
          >
            {copy.ignore}
          </Text>
        </Container>
        <Text
          style={{
            color: muted,
            fontSize: 12,
            textAlign: "center",
            margin: "20px 0 0",
          }}
        >
          <Link href={appUrl} style={{ color: muted, fontWeight: 700 }}>
            {appName}
          </Link>{" "}
          · {copy.footer}
        </Text>
      </Body>
    </Html>
  );
}

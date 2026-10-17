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

// Host notices (DECISIONS #54): "your album is ready" and the reminders
// before deletion. Same frame as the sign-in code email: logo, one heading,
// a short paragraph, one button, a quiet footer. Table-safe inline styles.

export type NoticeEmailProps = {
  locale: string;
  appName: string;
  appUrl: string;
  url: string;
  copy: {
    preview: string;
    heading: string;
    body: string;
    /** A highlighted line under the body, e.g. the deletion date. */
    note: string;
    button: string;
    footer: string;
  };
};

const ink = "#1f2630";
const muted = "#66707c";
const line = "#dbe3ee";
const primary = "#457094";

export function NoticeEmail({
  locale,
  appName,
  appUrl,
  url,
  copy,
}: NoticeEmailProps) {
  return (
    <Html lang={locale}>
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
            border: `1px solid ${line}`,
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
              fontSize: 26,
              lineHeight: "32px",
              fontWeight: 800,
              letterSpacing: "-0.02em",
              margin: "28px 0 10px",
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
          <Text
            style={{
              color: ink,
              fontSize: 15,
              fontWeight: 700,
              lineHeight: "22px",
              margin: "18px 0 0",
              padding: "12px 16px",
              backgroundColor: "#e8f0f8",
              borderRadius: 12,
            }}
          >
            {copy.note}
          </Text>
          <Section style={{ margin: "26px 0 6px" }}>
            <Button
              href={url}
              style={{
                backgroundColor: primary,
                color: "#ffffff",
                fontSize: 16,
                fontWeight: 700,
                padding: "15px 28px",
                borderRadius: 999,
              }}
            >
              {copy.button}
            </Button>
          </Section>
          <Hr style={{ borderColor: line, margin: "28px 0 20px" }} />
          <Text
            style={{
              color: muted,
              fontSize: 12,
              lineHeight: "18px",
              margin: 0,
            }}
          >
            <Link href={appUrl} style={{ color: muted, fontWeight: 700 }}>
              {appName}
            </Link>
            <br />
            {copy.footer}
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

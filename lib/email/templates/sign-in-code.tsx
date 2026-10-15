import {
  Body,
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

// Sign-in code email (DECISIONS #47). The layout follows the code emails
// people already trust (Slack, Linear, Notion): logo, one line of context,
// the code large in a box, how long it lasts, and a quiet footer. The code box
// borrows the guest ticket's perforation. Table-safe inline styles only.

export type SignInCodeEmailProps = {
  /** For `lang` and upper-casing ("GİRİŞ KODU", not "GIRIŞ KODU"). */
  locale: string;
  appName: string;
  appUrl: string;
  code: string;
  copy: {
    preview: string;
    heading: string;
    body: string;
    codeLabel: string;
    validity: string;
    ignore: string;
    footer: string;
  };
};

const ink = "#1f2630";
const muted = "#66707c";
const line = "#dbe3ee";

export function SignInCodeEmail({
  locale,
  appName,
  appUrl,
  code,
  copy,
}: SignInCodeEmailProps) {
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

          <Section
            style={{
              margin: "28px 0 12px",
              backgroundColor: "#e8f0f8",
              border: "2px dashed #9db6d2",
              borderRadius: 16,
              padding: "18px 12px 20px",
              textAlign: "center",
            }}
          >
            <Text
              style={{
                color: muted,
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.16em",
                margin: "0 0 6px",
              }}
            >
              {copy.codeLabel.toLocaleUpperCase(locale)}
            </Text>
            <Text
              style={{
                color: "#2f5478",
                fontFamily:
                  "'SF Mono', SFMono-Regular, Menlo, Consolas, 'Courier New', monospace",
                fontSize: 40,
                lineHeight: "48px",
                fontWeight: 700,
                letterSpacing: "0.32em",
                margin: 0,
                paddingLeft: "0.32em",
              }}
            >
              {code}
            </Text>
          </Section>
          <Text style={{ color: muted, fontSize: 13, margin: "0 0 4px" }}>
            {copy.validity}
          </Text>

          <Hr style={{ borderColor: line, margin: "24px 0 20px" }} />
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
          </Link>
          <br />
          {copy.footer}
        </Text>
      </Body>
    </Html>
  );
}

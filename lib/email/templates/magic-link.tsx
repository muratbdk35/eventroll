import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from "@react-email/components";

export type MagicLinkEmailProps = {
  appName: string;
  url: string;
  copy: {
    preview: string;
    heading: string;
    body: string;
    button: string;
    ignore: string;
  };
};

export function MagicLinkEmail({ appName, url, copy }: MagicLinkEmailProps) {
  return (
    <Html>
      <Head />
      <Preview>{copy.preview}</Preview>
      <Body
        style={{
          backgroundColor: "#fbf8f4",
          fontFamily: "Helvetica, Arial, sans-serif",
        }}
      >
        <Container
          style={{
            maxWidth: 480,
            margin: "40px auto",
            padding: 32,
            backgroundColor: "#ffffff",
            borderRadius: 16,
          }}
        >
          <Text
            style={{
              fontSize: 14,
              fontWeight: 700,
              color: "#b4532a",
              margin: 0,
            }}
          >
            {appName}
          </Text>
          <Heading style={{ fontSize: 22, color: "#2b211c" }}>
            {copy.heading}
          </Heading>
          <Text style={{ fontSize: 15, color: "#4a3d36", lineHeight: "24px" }}>
            {copy.body}
          </Text>
          <Section style={{ margin: "24px 0" }}>
            <Button
              href={url}
              style={{
                backgroundColor: "#b4532a",
                color: "#ffffff",
                padding: "12px 20px",
                borderRadius: 10,
                fontWeight: 600,
              }}
            >
              {copy.button}
            </Button>
          </Section>
          <Text style={{ fontSize: 13, color: "#7a6b62" }}>{copy.ignore}</Text>
        </Container>
      </Body>
    </Html>
  );
}

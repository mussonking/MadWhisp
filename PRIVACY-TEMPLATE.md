# Privacy Policy — MotsDits

**This is a TEMPLATE. Replace all `{{PLACEHOLDERS}}` with your actual values
and have a Quebec/Canadian privacy lawyer review before commercial release —
especially for Loi 25 compliance. This template is not legal advice.**

---

**MotsDits Privacy Policy**

Last updated: {{EFFECTIVE_DATE}}

{{COMPANY_LEGAL_NAME}} ("MotsDits", "we", "us") respects your privacy. This
Privacy Policy describes what personal information we collect (if any), how
we use it, and your rights under applicable privacy laws, including Quebec's
_Act respecting the protection of personal information in the private sector_
("Loi 25") and Canada's _Personal Information Protection and Electronic
Documents Act_ ("PIPEDA").

## 1. Privacy by Design — On-Device Processing

MotsDits is designed to process your audio **locally on your device**. By
default:

- Your microphone audio is captured, transcribed, and discarded entirely on
  your computer. **No audio data leaves your device.**
- Speech-to-text is performed using local AI models (Whisper, Parakeet,
  Moonshine, etc.) downloaded to your machine.
- Your transcribed text is written directly into the application of your
  choice via simulated keyboard input.
- Optional transcription history is stored locally in a SQLite database in
  your application data directory and is never transmitted off-device.

## 2. Information We Collect

### 2.1 Information you provide

- **Account information** (if you create an account): name, email address,
  payment information processed by our payment provider {{PAYMENT_PROCESSOR}}.
  We do not store your full credit card number.
- **License key** generated at purchase, used to activate the Software.
- **Support communications** you send to {{SUPPORT_EMAIL}}.

### 2.2 Information collected automatically

- **License validation pings**: when the Software starts and periodically
  thereafter, it sends an HTTPS request to {{LICENSE_SERVER}} containing
  your license key, the Software version, your operating system, and a
  hashed device identifier. We use this strictly to verify license validity
  and detect license abuse. We do not log IP addresses for longer than
  {{IP_LOG_RETENTION_DAYS}} days.
- **Update checks** (only if you enable them in Settings): the Software
  fetches a manifest from {{UPDATE_SERVER}} to determine whether a new
  version is available. No personal information is sent.
- **Crash reports** (only if you opt in): anonymized stack traces and
  application state, sent to {{CRASH_REPORTING_PROVIDER}}. Audio content,
  transcribed text, and license keys are never included in crash reports.

### 2.3 Information we do NOT collect

- Audio recordings.
- Transcribed text.
- Contents of any other application running on your device.
- Browsing history.
- Files on your device.

## 3. Optional Cloud Services

MotsDits offers an optional **post-processing** feature that sends your
transcribed text to a third-party large language model provider chosen by
you (e.g., OpenAI, Anthropic, Google Gemini, Groq). When you enable
post-processing:

- You provide your own API key for the chosen provider, stored locally on
  your device only.
- Your transcribed text is sent directly from your device to that provider's
  API, using credentials you supply.
- {{COMPANY_LEGAL_NAME}} does not receive, intercept, log, or process this
  text in transit.
- The provider's privacy practices govern that data; please review their
  policies before enabling this feature.

You may disable post-processing at any time in Settings, in which case no
data is sent to any third party.

## 4. How We Use Information

We use the limited information described in section 2 only to:

- Verify and enforce license validity.
- Provide product updates.
- Respond to support requests.
- Diagnose and fix bugs (only with your opt-in consent).
- Comply with applicable legal obligations.

We do **not**:

- Sell, rent, or trade your personal information.
- Use your information for behavioural advertising.
- Profile you for marketing purposes.

## 5. Data Retention

- Account information: retained for the duration of your active license,
  plus {{ACCOUNT_RETENTION_PERIOD}} after termination, then deleted unless
  retention is required by law.
- License validation logs: {{LICENSE_LOG_RETENTION}}.
- Support communications: {{SUPPORT_RETENTION_PERIOD}}.

## 6. Where Information Is Stored

Personal information collected by {{COMPANY_LEGAL_NAME}} is stored on servers
located in {{SERVER_LOCATION}}. We use {{HOSTING_PROVIDER}} as our hosting
provider. Where personal information is transferred outside Quebec, we ensure
that the recipient provides protections substantially similar to those
required under Loi 25, in accordance with section 17 of the Act.

## 7. Your Rights Under Loi 25 and PIPEDA

Subject to applicable law, you have the right to:

- **Access** the personal information we hold about you.
- **Rectify** inaccurate or incomplete information.
- **Withdraw consent** to processing, where consent is the legal basis.
- **Request deletion** of your personal information ("right to erasure"),
  subject to legal retention requirements.
- **Data portability** — receive your information in a structured,
  commonly-used, machine-readable format.
- **Lodge a complaint** with the _Commission d'accès à l'information du
  Québec_ (CAI) at <https://www.cai.gouv.qc.ca/> or with the Office of the
  Privacy Commissioner of Canada at <https://www.priv.gc.ca/>.

To exercise any of these rights, contact our Privacy Officer at
{{PRIVACY_OFFICER_EMAIL}}. We will respond within thirty (30) days of receipt.

## 8. Privacy Officer

In accordance with section 3.1 of Loi 25, {{COMPANY_LEGAL_NAME}} has
designated a Privacy Officer responsible for ensuring compliance with this
Policy and applicable privacy law:

- Name: {{PRIVACY_OFFICER_NAME}}
- Email: {{PRIVACY_OFFICER_EMAIL}}
- Address: {{COMPANY_ADDRESS}}

## 9. Security

We use industry-standard administrative, technical, and physical safeguards
to protect personal information, including TLS encryption in transit,
encryption at rest where applicable, access controls, and routine security
reviews. No system can be guaranteed perfectly secure; in the event of a
breach affecting your personal information, we will notify you and the
Commission d'accès à l'information du Québec as required by law.

## 10. Children

MotsDits is not directed at children under the age of 14. We do not
knowingly collect personal information from children under 14. If you
believe a child has provided us with personal information, please contact
us at {{PRIVACY_OFFICER_EMAIL}} and we will delete the information.

## 11. Changes to This Policy

We may update this Privacy Policy from time to time. Material changes will
be communicated via {{NOTIFICATION_METHOD}} at least thirty (30) days
before they take effect. The date at the top of this Policy indicates when
it was last revised.

## 12. Contact

For any question regarding this Privacy Policy or our handling of your
personal information:

- General: {{PRIVACY_OFFICER_EMAIL}}
- Mailing address: {{COMPANY_ADDRESS}}

---

The parties have expressly required that this Privacy Policy be drafted in
English. Les parties ont expressément exigé que la présente politique soit
rédigée en anglais. A French translation is available upon request at
{{PRIVACY_OFFICER_EMAIL}}.

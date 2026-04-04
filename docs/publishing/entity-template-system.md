# Industrial Wireless I/O Template System

This repository is designed for AI-operated publishing, but the output must work like a field engineering reference. Pages should help utilities, telemetry designers, and integrators make durable site decisions under real coverage, power, and maintenance constraints.

## Publishing bar

Every substantive page must do all of the following:

1. Target a real remote-site problem with uptime or service consequences.
2. Explain architecture fit, poor fit, and field maintenance implications.
3. Treat power, enclosure, antenna, carrier, and alarm logic as part of the system, not side notes.
4. Give enough detail that a reader can pressure-test a design before buying hardware.
5. Move the reader to the next relevant layer: application, network path, protocol, hardware, reliability, or vendor.

General depth targets:

- `seed`: usually 1,200+ words
- `growing`: usually 1,500+ words
- `cornerstone`: usually 1,800+ words

Do not publish:

- radio comparisons with no site context
- hardware summaries that ignore field serviceability
- application pages that skip alarm behavior or local resilience
- connectivity pages that assume perfect power or perfect carrier conditions

## Shared frontmatter

Use these fields on every substantive page:

- `title`
- `description`
- `referenceType`
- `adProfile`
- `commercialIntent`
- `reviewCadence`
- `primaryKeyword`
- `searchIntent`
- `decisionStage`
- `targetRoles`
- `contentStatus`
- `problemSolved`
- `readerTakeaway`
- `keyQuestions`
- `notFor`
- `updateTriggers`

## Universal long-form structure

Use this shape unless the topic strongly requires a different order:

1. `Quick answer`
2. `When this page should guide the design`
3. `Site constraints and operating pressures`
4. `Recommended architecture logic`
5. `Network, protocol, hardware, and alarm implications`
6. `Failure modes and poor-fit cases`
7. `Field checklist`
8. `Related pages to read next`

## Application template

Use for pump stations, tank farms, water sites, utilities, and remote telemetry deployments.

Required sections:

1. Quick answer and site fit
2. Field pressures and operating limits
3. Recommended architecture sequence
4. Network, protocol, and hardware fit
5. Reliability pitfalls and service burdens
6. Field checklist
7. Related pages to continue the design

## Vendor template

Use for Siemens, Phoenix Contact, Moxa, Digi, and other ecosystem pages.

Required sections:

1. Where the vendor matters
2. Best-fit deployment types
3. Ecosystem strengths in real field conditions
4. Watchouts, support limits, or mismatch cases
5. Related product-family and application pages

## Product family template

Use for telemetry gateways, remote I/O, RTUs, antennas, power systems, and rugged hardware categories.

Required sections:

1. What the category is for
2. Where it sits in the field stack
3. What problem it solves well
4. When it is the wrong choice
5. Practical buying and maintenance signals
6. Related protocol or network-path pages

## Protocol and network-path template

Use for Modbus, MQTT, OPC UA, cellular, LoRaWAN, satellite, and similar topics.

Required sections:

1. Which layer the decision belongs to
2. Typical fit by site condition
3. Common field mistake
4. Hardware and reliability consequences
5. Compare next

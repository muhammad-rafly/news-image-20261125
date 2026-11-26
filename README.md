# The World Today — Wednesday 25 November 2026

[![make.fun bounty](https://make.fun/badge/news-image-20261125.svg)](https://make.fun/bounty/news-image-20261125?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261125)
[![rank](https://make.fun/badge/news-image-20261125/muhammad-rafly/news-image-20261125/rank.svg)](https://make.fun/bounty/news-image-20261125/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261125)
[![reward](https://make.fun/badge/news-image-20261125/muhammad-rafly/news-image-20261125/reward.svg)](https://make.fun/bounty/news-image-20261125?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261125)

A single deterministic image summing up the world news of Wednesday 25 November 2026,
drawn as a newspaper front page called **THE WORLD TODAY**. Built for the
[make.fun news-image-20261125 bounty](https://make.fun/bounty/news-image-20261125).

## The day's stories

Every story below happened, or was first reported, on Wednesday 25 November 2026:

- **Mines in the Strait (lead)** — Iran's Revolutionary Guard said two oil tankers
  struck naval mines and caught fire in the Strait of Hormuz; Tehran also claimed
  it shot down two US drones over the strait. President Trump said funding for the
  US campaign against Iran is secured through January.
- **Tariffs on 14 partners** — Washington proposes 20–40% tariffs on 14 trading
  partners; nothing takes effect before a January 25 hearing.
- **Pakistan's first astronaut** — China's Shenzhou-24 docked at its space station
  carrying Pakistan's Muhammad Zeeshan Ali, the first foreign astronaut aboard.
- **Wall St slides, Bitcoin sinks** — the S&P 500 fell 2.2% and the Nasdaq 3.2% on
  AI, inflation and tariff fears; Bitcoin slid below $58,000.
- Plus eight more stories in the IN BRIEF panel: the Australia–Solomon Islands
  treaty barring foreign bases, the Houthis' claim of hitting Saudi Arabia's
  Ras Tanura refinery, RSF drone strikes killing 19 civilians in Sudan,
  Zelensky's €115 billion aid ask for 2027, Bangladesh's 36% garment-wage rise,
  eurozone inflation at 4.0%, the US Army destroying 5 tons of explosives in
  Iowa, and SpaceX cleared to fly 1 million orbital data-centre satellites.

## How it is made

`main.ts` (Node 22, standard library only) draws the page pixel by pixel into an
RGB buffer with a hand-built 5×7 bitmap font and encodes a plain 8-bit RGB PNG
itself. No network, no clock, no randomness — two runs produce byte-identical
output. The image is 1024×1024 and under 1 MiB.

## Run

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

This writes `out/entry.png`.

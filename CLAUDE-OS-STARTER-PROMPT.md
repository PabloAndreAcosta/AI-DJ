# ClaudeOS -- Startprompt for nytt projekt

Kopiera allt under linjen nedan och klistra in som din forsta prompt i en ny Claude Code-session i ratt repo.

---

## Prompt att kopiera:

```
Jag vill bygga "ClaudeOS" -- en native iOS-app (Swift/SwiftUI) som tar over hela iPhone-upplevelsen och styrs helt av Claude AI. Telefonen ska kannas som ett AI-operativsystem dar anvandaren bara pratar/skriver med Claude och AI:n gor allt.

## Bakgrund

- Att ersatta iOS ar omojligt (Apples lasta bootloader). Istallet bygger vi en fullskarms-app som lasas till enheten via MDM/Guided Access (Single App Mode).
- Startpunkten ar AI-DJ-funktionalitet (musikstyrning for fester), som sedan expanderas till fullstandigt AI-shell.

## Vad appen ska gora

ClaudeOS ar en fullskarms iOS-app som anvander Claude API:s tool use (function calling) for att styra telefonens funktioner. Anvandaren ser aldrig iOS hemskarm.

### Karnfunktioner (Fas 1 - MVP)

1. **Fullskarms konversations-UI** (SwiftUI) -- chat-bubbla-granssnitt, dark mode
2. **Claude API-integration** -- streaming, tool use, konversationsminne
3. **Rostinteraktion** -- Speech framework (tal-till-text) + AVSpeechSynthesizer (text-till-tal)
4. **AI-DJ / Musikstyrning** -- MusicKit for Apple Music, rostforfragan ("spela nagon bra fest-musik"), spellista-skapande
5. **Telefonsamtal** -- CallKit integration
6. **Meddelanden** -- MessageUI (SMS/iMessage)
7. **Kalender & Paminnelser** -- EventKit
8. **Kontakter** -- Contacts framework (injiceras i systemprompt som kontext)

### Arkitektur

```
ClaudeOS/
  App/
    ClaudeOSApp.swift              -- App entry point
  Views/
    ConversationView.swift         -- Fullskarms chat-UI
    MessageBubble.swift            -- Enskild meddelandebubbla
    AmbientDisplayView.swift       -- Klocka/vader-lage
  Services/
    ClaudeAPIClient.swift          -- Anthropic API (streaming + tool use)
    ToolRouter.swift               -- Mappar Claudes tool-calls -> iOS-actions
    VoiceService.swift             -- Tal-till-text + text-till-tal
    ConversationManager.swift      -- Historik, kontext, minneshantering
  Tools/
    PhoneCallTool.swift            -- CallKit
    MessageTool.swift              -- MessageUI
    CalendarTool.swift             -- EventKit
    MusicTool.swift                -- MusicKit (AI-DJ!)
    ContactsTool.swift             -- Contacts framework
    NavigationTool.swift           -- MapKit
    SmartHomeTool.swift            -- HomeKit
  Models/
    Conversation.swift             -- SwiftData-modell
    Message.swift                  -- Meddelande-modell
    ToolCall.swift                 -- Tool call-modell
  Config/
    SystemPrompt.swift             -- Claude system prompt med enhetskontext
```

### Claude API Tool Use-monster

Appen definierar "tools" som Claude kan anropa:

- make_phone_call(contact_name, phone_number)
- send_message(recipient, body, via: "sms"|"imessage")
- play_music(query, source: "apple_music")
- create_playlist(name, songs)
- set_alarm(time, label)
- create_reminder(title, due_date)
- get_calendar_events(date_range)
- navigate_to(destination)
- take_photo()
- control_smart_home(device, action)
- search_web(query)

### Tech Stack

- Swift + SwiftUI (iOS 17+)
- Claude API (Sonnet 4.6 for snabba svar, Opus 4.6 for komplex resonering)
- SwiftData for lokal datalagring
- Apple Speech framework
- AVSpeechSynthesizer (eller ElevenLabs for naturligare rost)

### Systemprompten ska innehalla:

- Instruktion att Claude ar "ClaudeOS" och styr hela telefonen
- Aktuell tid, plats, batteriniva
- Kommande kalenderhandardelser
- Kontaktlista (injiceras dynamiskt)
- Tillgangliga tools
- Regler: bekrafta destruktiva handlingar, svara pa svenska, kort och koncist for rostoutput

## Borja med:

1. Satt upp Xcode-projektet med ratt mappstruktur
2. Skapa ClaudeAPIClient.swift med streaming och tool use
3. Bygg ConversationView.swift (fullskarms chat-UI)
4. Implementera VoiceService.swift (tal-in/ut)
5. Bygg MusicTool.swift (AI-DJ som forsta tool -- det ar MVP:n!)
6. Koppla ihop allt via ToolRouter.swift

Spraaket i UI:t ska vara svenska. Koden och kommentarer pa engelska.
```

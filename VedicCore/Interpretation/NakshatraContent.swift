import Foundation

// MARK: - Nakshatra IDs (internal only — user never sees these names)

public enum NakshatraID: Int, CaseIterable {
    case ashwini = 1
    case bharani
    case krittika
    case rohini
    case mrigashira
    case ardra
    case punarvasu
    case pushya
    case ashlesha
    case magha
    case purvaPhalguni
    case uttaraPhalguni
    case hasta
    case chitra
    case swati
    case vishakha
    case anuradha
    case jyeshtha
    case mula
    case purvaAshadha
    case uttaraAshadha
    case shravana
    case dhanishtha
    case shatabhisha
    case purvaBhadrapada
    case uttaraBhadrapada
    case revati
}

// MARK: - Nakshatra entry

public struct NakshatraEntry {
    public let id: NakshatraID
    /// ≤ 60 chars. Plain English. No Sanskrit.
    public let headline: String
    /// One word.
    public let color: String
    /// 1–3 words.
    public let food: String
    /// 2–3 sentences. Expanded detail for large widget / Today view.
    public let detailedText: String
}

// MARK: - Content library

public enum NakshatraContent {

    public static let all: [NakshatraID: NakshatraEntry] = {
        var d: [NakshatraID: NakshatraEntry] = [:]
        for entry in entries { d[entry.id] = entry }
        return d
    }()

    public static func entry(for index: Int) -> NakshatraEntry {
        let id = NakshatraID(rawValue: index) ?? .ashwini
        return all[id] ?? all[.ashwini]!
    }

    // swiftlint:disable line_length
    private static let entries: [NakshatraEntry] = [

        NakshatraEntry(
            id: .ashwini,
            headline: "Fast-moving day. Start things early.",
            color: "Red",
            food: "Honey",
            detailedText: "Energy is high and decisions come quickly today. Morning hours are best for new starts — don't overthink. Avoid rushing through conversations; speed is an asset, impatience is not."
        ),

        NakshatraEntry(
            id: .bharani,
            headline: "Intense day. Own your choices.",
            color: "Black",
            food: "Spicy food",
            detailedText: "Today rewards boldness and penalises hesitation. Creative and professional risks taken now tend to stick. Keep your commitments — today has a long memory for what you promise."
        ),

        NakshatraEntry(
            id: .krittika,
            headline: "Sharp focus. Cut what isn't working.",
            color: "White",
            food: "Wheat",
            detailedText: "Clarity is your advantage today. Edit, refine, and discard what's been slowing you down. Honest conversations — even uncomfortable ones — land better now than they will later."
        ),

        NakshatraEntry(
            id: .rohini,
            headline: "Steady day. Good for building things.",
            color: "Pink",
            food: "Milk",
            detailedText: "Growth and material progress are favoured today. Investments, negotiations, creative work, and anything requiring patience all benefit. People around you are more receptive than usual."
        ),

        NakshatraEntry(
            id: .mrigashira,
            headline: "Curious day. Follow the thread.",
            color: "Green",
            food: "Coconut",
            detailedText: "Your mind wants to explore, not settle. Research, planning, and scouting new directions are well-starred. Don't force conclusions — let questions lead where they lead."
        ),

        NakshatraEntry(
            id: .ardra,
            headline: "Turbulent day. Stay grounded.",
            color: "Blue",
            food: "Lentils",
            detailedText: "Expect unexpected turns or emotional weather today. Change is the theme, not chaos. Stay grounded and you'll navigate it; resist and it'll feel worse than it is."
        ),

        NakshatraEntry(
            id: .punarvasu,
            headline: "Renewal day. Return to what matters.",
            color: "Yellow",
            food: "Ghee",
            detailedText: "Good for restarting stuck projects, repairing relationships, and course-correcting. Home and family themes surface. Whatever you nurture today tends to take root."
        ),

        NakshatraEntry(
            id: .pushya,
            headline: "Steady day. Good for finishing things.",
            color: "Yellow",
            food: "Rice",
            detailedText: "Today rewards care, precision, and patience more than speed. Work requiring attention to detail benefits most. A good day to wrap up loose ends and take stock."
        ),

        NakshatraEntry(
            id: .ashlesha,
            headline: "Strategic day. Think before you act.",
            color: "Black",
            food: "Tamarind",
            detailedText: "Today rewards careful, long-game thinking. Avoid making snap decisions or sharing plans prematurely. Research, strategy, and quiet work outperform visible hustle."
        ),

        NakshatraEntry(
            id: .magha,
            headline: "Authority day. Step into the room.",
            color: "Ivory",
            food: "Barley",
            detailedText: "Leadership, recognition, and status themes are active. Good for making formal requests, presenting your work, or having high-stakes conversations. Confidence reads as competence today."
        ),

        NakshatraEntry(
            id: .purvaPhalguni,
            headline: "Enjoyment day. Don't overwork.",
            color: "Coral",
            food: "Fruit",
            detailedText: "Creativity, pleasure, and connection are favoured. Schedule something you enjoy, not just something you should do. Productivity from forced effort is low — lean into flow instead."
        ),

        NakshatraEntry(
            id: .uttaraPhalguni,
            headline: "Dependable day. Honour your word.",
            color: "White",
            food: "Sesame",
            detailedText: "Contracts, agreements, and formal commitments made today tend to hold. Good for partnership discussions and follow-through on promises. Reliability is the winning move."
        ),

        NakshatraEntry(
            id: .hasta,
            headline: "Hands-on day. Make something.",
            color: "Green",
            food: "Vegetables",
            detailedText: "Practical, tangible work pays off today. Build, repair, organise, or create. Negotiations and trades also go well — people are in a reasonable mood. Show your craft."
        ),

        NakshatraEntry(
            id: .chitra,
            headline: "Creative day. Aesthetic matters.",
            color: "Orange",
            food: "Saffron rice",
            detailedText: "Design, visual work, and anything requiring originality are at a peak. First impressions land well — this is a good day for a pitch, a photo, or a public debut. Make it beautiful."
        ),

        NakshatraEntry(
            id: .swati,
            headline: "Flexible day. Adapt as you go.",
            color: "Smoky grey",
            food: "Curd",
            detailedText: "The mood today is restless but adaptable. Don't grip plans too tightly — the best outcome probably doesn't look like the plan. Stay in motion and adjust; stagnation costs more than missteps."
        ),

        NakshatraEntry(
            id: .vishakha,
            headline: "Determined day. Push for results.",
            color: "Gold",
            food: "Tiger lily",
            detailedText: "Energy and ambition are both up. Good for persistent effort toward a specific goal. Avoid spreading attention — pick the one thing that matters and drive it forward."
        ),

        NakshatraEntry(
            id: .anuradha,
            headline: "Cooperative day. Work with others.",
            color: "Red",
            food: "Coconut",
            detailedText: "Friendship, alliances, and team effort are favoured today. Collaborative projects move faster than solo ones. Reach out to someone you've been meaning to reconnect with."
        ),

        NakshatraEntry(
            id: .jyeshtha,
            headline: "Protective day. Guard what you've built.",
            color: "Cream",
            food: "Bitter gourd",
            detailedText: "Leadership and responsibility weigh heavier today. Good for defending a position, handling difficult conversations, and protecting long-term interests over short-term convenience."
        ),

        NakshatraEntry(
            id: .mula,
            headline: "Root-cause day. Question the premise.",
            color: "Brown",
            food: "Root vegetables",
            detailedText: "Today cuts to the source. Good for diagnostics, getting to the bottom of ongoing problems, and making changes you've been avoiding. Surface-level fixes won't stick."
        ),

        NakshatraEntry(
            id: .purvaAshadha,
            headline: "Conviction day. Back yourself.",
            color: "Silver",
            food: "Coconut water",
            detailedText: "Confidence and persuasion are at their best. Good for selling, influencing, and making the case for something you believe in. Don't underestimate your own position today."
        ),

        NakshatraEntry(
            id: .uttaraAshadha,
            headline: "Victory day. Finish what you started.",
            color: "Copper",
            food: "Jaggery",
            detailedText: "Completion is the theme today. Things started earlier that have stalled may finally break through. Push to close open loops — the effort-to-result ratio is better than usual."
        ),

        NakshatraEntry(
            id: .shravana,
            headline: "Listening day. Hear before you speak.",
            color: "Blue",
            food: "Khichdi",
            detailedText: "Learning, gathering information, and careful listening carry the day. Advice given to others lands well. Hold back your own agenda and pay attention to what's actually being said."
        ),

        NakshatraEntry(
            id: .dhanishtha,
            headline: "Rhythm day. Get into a groove.",
            color: "Silver",
            food: "Sesame",
            detailedText: "Momentum and music are the themes. Routine tasks feel lighter; sustained effort accumulates well. If you've been struggling to find your pace, today is a good re-entry point."
        ),

        NakshatraEntry(
            id: .shatabhisha,
            headline: "Solitude day. Think it through alone.",
            color: "Blue-black",
            food: "Dry fruits",
            detailedText: "Deep thinking and inner work are favoured over social activity. Good for research, problem-solving, and decisions that benefit from time away from other people's opinions."
        ),

        NakshatraEntry(
            id: .purvaBhadrapada,
            headline: "Intense focus. Avoid impulsiveness.",
            color: "Silver",
            food: "Jackfruit",
            detailedText: "The day brings heat and focus. Powerful for sustained creative or intellectual effort. The risk is overreacting — check yourself before sending that message."
        ),

        NakshatraEntry(
            id: .uttaraBhadrapada,
            headline: "Patience day. Play the long game.",
            color: "Purple",
            food: "Milk",
            detailedText: "Wisdom and long-horizon thinking are the edges today. Avoid chasing quick wins. Decisions made with discipline and restraint now tend to pay off over weeks and months."
        ),

        NakshatraEntry(
            id: .revati,
            headline: "Gentle day. Take care of people.",
            color: "Yellow",
            food: "Sweet rice",
            detailedText: "A nurturing, compassionate note to the day. Good for helping others, tying up loose ends, and preparing for what comes next. Don't push for more than is needed."
        ),
    ]
    // swiftlint:enable line_length
}

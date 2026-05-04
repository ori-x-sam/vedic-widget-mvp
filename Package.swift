// swift-tools-version: 5.10
import PackageDescription

let cSwissEphemeris = Target.systemLibrary(
    name: "SwissEphemeris",
    path: "VedicCore/Ephemeris/swisseph",
    providers: []
)

// C source files we actually need from swisseph (exclude swetest.c, obama.c, etc.)
let swissephCSources: [String] = [
    "VedicCore/Ephemeris/swisseph/sweph.c",
    "VedicCore/Ephemeris/swisseph/swephlib.c",
    "VedicCore/Ephemeris/swisseph/swecl.c",
    "VedicCore/Ephemeris/swisseph/swedate.c",
    "VedicCore/Ephemeris/swisseph/swehouse.c",
    "VedicCore/Ephemeris/swisseph/swejpl.c",
    "VedicCore/Ephemeris/swisseph/swemmoon.c",
    "VedicCore/Ephemeris/swisseph/swemplan.c",
    "VedicCore/Ephemeris/swisseph/swehel.c",
    "VedicCore/Ephemeris/swisseph/sweephe4.c",
    "VedicCore/Ephemeris/swisseph/swevents.c",
]

let package = Package(
    name: "VedicWidget",
    platforms: [
        .macOS(.v13),
        .iOS(.v17),
    ],
    products: [
        .library(name: "VedicCore", targets: ["VedicCore"]),
        .executable(name: "VedicCLI", targets: ["VedicCLI"]),
    ],
    targets: [
        // --- SwissEphemeris C library (compiled directly, not as a system lib) ---
        .target(
            name: "CSwissEphemeris",
            path: "VedicCore/Ephemeris/swisseph",
            sources: [
                "sweph.c",
                "swephlib.c",
                "swecl.c",
                "swedate.c",
                "swehouse.c",
                "swejpl.c",
                "swemmoon.c",
                "swemplan.c",
                "swehel.c",
                "sweephe4.c",
                "swevents.c",
            ],
            publicHeadersPath: ".",
            cSettings: [
                .define("MSDOS", to: nil),
                .unsafeFlags(["-w"])   // suppress C warnings in vendored code
            ]
        ),

        // --- VedicCore framework (shared between app and widget) ---
        .target(
            name: "VedicCore",
            dependencies: ["CSwissEphemeris"],
            path: "VedicCore",
            exclude: ["Ephemeris/swisseph"]
        ),

        // --- CLI verification target (macOS only) ---
        .executableTarget(
            name: "VedicCLI",
            dependencies: ["VedicCore"],
            path: "CLI"
        ),

        // --- Tests ---
        .testTarget(
            name: "VedicCoreTests",
            dependencies: ["VedicCore"],
            path: "Tests"
        ),
    ]
)

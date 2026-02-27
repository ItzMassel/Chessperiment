export interface Announcement {
    id: string;
    date: string;
    author: string;
    image: string;
    title: {
        en: string;
        de: string;
        [key: string]: string;
    };
    shortDescription: {
        en: string;
        de: string;
        [key: string]: string;
    };
    content: {
        en: string;
        de: string;
        [key: string]: string;
    };
}

const announcements: Announcement[] = [
    {
        id: 'projects-launch',
        date: '2026-02-03',
        author: 'Lasse T.',
        image: '/announcement_2.png',
        title: {
            en: 'Beyond the Board: Introducing Projects on Chessperiment',
            de: 'Über das Brett hinaus: Einführung von Projekten auf Chessperiment'
        },
        shortDescription: {
            en: 'Create, play, and share your own abstract strategy games. Explore a new dimension of logic and design.',
            de: 'Erstelle, spiele und teile deine eigenen abstrakten Strategiespiele. Entdecke eine neue Dimension von Logik und Design.'
        },
        content: {
            en: `
                <p>Welcome to Chessperiment! We're incredibly excited to announce a major evolution of our platform. Chessperiment isn't just about playing variants; it's a sandbox for inventing entirely new turn-based games.</p>
                
                <p>To give you more power and organization, we are moving away from individual tools and introducing <strong>Projects</strong>. A Project is your dedicated workspace—a container for a single game vision where your pieces, rules, and boards live together in harmony.</p>
                
                <h3>What's inside a Chessperiment Project?</h3>
                
                <p><strong>Integrated Project Workspace:</strong> No more jumping between random editors. Start a project, name your game, and keep all your custom assets in one place.</p>
                
                <p><strong>Custom Piece & Logic Editor:</strong> Use our pixel-art editor to draw your pieces and our Scratch-like visual logic builder to define how they move and interact. From "Teleporting Wizards" to "Chain-Reaction Tanks," if you can imagine the logic, you can build it.</p>
                
                <p><strong>Dynamic Board Editor:</strong> Design the battlefield. Activate or deactivate squares to create unique topologies (like holes in the board or split-level play) and set your custom starting positions.</p>
                
                <p><strong>Instant Playtesting:</strong> Launch a Live Lobby directly from your project. Challenge friends with a private link or test your mechanics against a generalized Stockfish engine that adapts to your custom rules on the fly.</p>
                
                <p><strong>Analysis & Versioning:</strong> Every game is recorded. Replay moves, branch off into new variations, and refine your game's balance based on real data.</p>
                
                <h3>The Future of Creation</h3>
                
                <p>By focusing on Projects, we're laying the groundwork for a "Marketplace" where you can eventually publish your finished games for the community to discover. Currently, users can create a limited number of projects, allowing you to focus on your best ideas and see them through from concept to checkmate.</p>
                
                <p>This is just the beginning of our journey to create the ultimate sandbox for abstract strategy. We can't wait to see what you build!</p>
                
                <p>Enjoy inventing,</p>
                <p><strong>Lasse T.</strong><br>Project Lead, Chessperiment.app</p>
            `,
            de: `
                <p>Willkommen bei Chessperiment! Wir freuen uns riesig, eine große Weiterentwicklung unserer Plattform anzukündigen. Bei Chessperiment geht es nicht nur um das Spielen von Varianten; es ist ein Sandkasten für die Erfindung völlig neuer rundenbasierter Spiele.</p>
                
                <p>Um dir mehr Kontrolle und Organisation zu geben, bewegen wir uns weg von einzelnen Tools und führen <strong>Projekte</strong> ein. Ein Projekt ist dein dedizierter Arbeitsbereich – ein Container für eine einzige Spielvision, in dem deine Figuren, Regeln und Bretter harmonisch zusammenleben.</p>
                
                <h3>Was ist in einem Chessperiment-Projekt enthalten?</h3>
                
                <p><strong>Integrierter Projekt-Arbeitsbereich:</strong> Kein Springen mehr zwischen zufälligen Editoren. Starte ein Projekt, benenne dein Spiel und behalte alle deine benutzerdefinierten Assets an einem Ort.</p>
                
                <p><strong>Eigener Figuren- & Logik-Editor:</strong> Nutze unseren Pixel-Art-Editor, um deine Figuren zu zeichnen, und unseren Scratch-ähnlichen visuellen Logik-Builder, um zu definieren, wie sie sich bewegen und interagieren. Von "Teleportierenden Zauberern" bis zu "Kettenreaktions-Panzern" – wenn du dir die Logik vorstellen kannst, kannst du sie bauen.</p>
                
                <p><strong>Dynamischer Brett-Editor:</strong> Gestalte das Schlachtfeld. Aktiviere oder deaktiviere Felder, um einzigartige Topologien zu erstellen (wie Löcher im Brett oder mehrstufiges Spiel) und lege deine benutzerdefinierten Startpositionen fest.</p>
                
                <p><strong>Sofortiges Playtesting:</strong> Starte eine Live-Lobby direkt aus deinem Projekt. Fordere Freunde mit einem privaten Link heraus oder teste deine Mechaniken gegen eine generalisierte Stockfish-Engine, die sich spontan an deine benutzerdefinierten Regeln anpasst.</p>
                
                <p><strong>Analyse & Versionierung:</strong> Jedes Spiel wird aufgezeichnet. Spiele Züge noch einmal ab, erstelle neue Varianten und verfeinere die Balance deines Spiels basierend auf echten Daten.</p>
                
                <h3>Die Zukunft der Kreation</h3>
                
                <p>Durch den Fokus auf Projekte legen wir den Grundstein für einen "Marktplatz", auf dem du deine fertigen Spiele für die Community veröffentlichen kannst. Derzeit können Nutzer eine begrenzte Anzahl von Projekten erstellen, sodass du dich auf deine besten Ideen konzentrieren und sie vom Konzept bis zum Schachmatt durchziehen kannst.</p>
                
                <p>Dies ist erst der Anfang unserer Reise, um den ultimativen Sandkasten für abstrakte Strategie zu schaffen. Wir können es kaum erwarten zu sehen, was du erschaffst!</p>
                
                <p>Viel Spaß beim Erfinden,</p>
                <p><strong>Lasse T.</strong><br>Projektleiter, Chessperiment.app</p>
            `
        }
    },
    {
        id: 'chessperiment-launch',
        date: '2026-01-20',
        author: 'Lasse T.',
        image: '/announcements/chessperiment-launch.png',
        title: {
            en: 'Welcome to Chessperiment: The Future of Custom Chess!',
            de: 'Willkommen bei Chessperiment: Die Zukunft des individuellen Schachs!'
        },
        shortDescription: {
            en: 'Create, play, and share your own chess pieces and rules. Explore a new dimension of the game.',
            de: 'Erstelle, spiele und teile deine eigenen Schachfiguren und Regeln. Entdecke eine neue Dimension des Spiels.'
        },
        content: {
            en: `
                <p>Welcome to Chessperiment! We're incredibly excited to finally launch the ultimate platform for custom chess enthusiasts. Chessperiment isn't just about playing chess; it's about making it your own.</p>
                <h3>What can you do on Chessperiment?</h3>
                <ul>
                    <li><strong>Custom Piece Editor:</strong> Use our pixel-art editor to draw your own pieces. Whether it's a dragon, a wizard, or a futuristic tank, you decide the look!</li>
                    <li><strong>Visual Logic Builder:</strong> Give your pieces unique powers! Our Scratch-like logic editor allows you to define movements, capture rules, and special effects without writing a single line of code.</li>
                    <li><strong>Board Editor:</strong> Don't stick to the standard layout. Create custom boards with your own pieces and unique starting positions.</li>
                    <li><strong>Live Game Lobby:</strong> Challenge your friends to a match or test your creations against Stockfish, the world's strongest chess engine, fully adapted to handle your custom rules.</li>
                    <li><strong>Move History & Analysis:</strong> Every game is recorded. Replay your moves, branch off into new variations, and perfect your strategy.</li>
                </ul>
                <p>This is just the beginning. We have many more features planned, and we can't wait to see what amazing games you'll create. Thank you for being part of our journey!</p>
                <p>Enjoy playing,</p>
                <p><strong>Lasse T.</strong></p>
            `,
            de: `
                <p>Willkommen bei Chessperiment! Wir freuen uns riesig, endlich die ultimative Plattform für Fans von individuellem Schach zu starten. Bei Chessperiment geht es nicht nur darum, Schach zu spielen – es geht darum, es zu deinem eigenen Spiel zu machen.</p>
                <h3>Was kannst du auf Chessperiment machen?</h3>
                <ul>
                    <li><strong>Eigener Figuren-Editor:</strong> Nutze unseren Pixel-Art-Editor, um deine eigenen Figuren zu zeichnen. Ob Drache, Zauberer oder futuristischer Panzer – du bestimmst das Aussehen!</li>
                    <li><strong>Visueller Logik-Editor:</strong> Gib deinen Figuren einzigartige Kräfte! Unser Scratch-ähnlicher Logik-Editor ermöglicht es dir, Bewegungen, Schlagregeln und Spezialeffekte zu definieren, ohne eine einzige Zeile Code zu schreiben.</li>
                    <li><strong>Brett-Editor:</strong> Halte dich nicht an das Standard-Layout. Erstelle eigene Bretter mit deinen Figuren und einzigartigen Startpositionen.</li>
                    <li><strong>Live-Spiel-Lobby:</strong> Fordere deine Freunde zu einer Partie heraus oder teste deine Kreationen gegen Stockfish, die stärkste Schach-Engine der Welt, die vollständig angepasst wurde, um mit deinen individuellen Regeln umzugehen.</li>
                    <li><strong>Spielverlauf & Analyse:</strong> Jedes Spiel wird aufgezeichnet. Spiele deine Züge noch einmal ab, erstelle Varianten und perfektioniere deine Strategie.</li>
                </ul>
                <p>Dies ist erst der Anfang. Wir haben noch viele weitere Funktionen geplant und können es kaum erwarten zu sehen, welche fantastischen Spiele du erschaffen wirst. Vielen Dank, dass du Teil unserer Reise bist!</p>
                <p>Viel Spaß beim Spielen,</p>
                <p><strong>Lasse T.</strong></p>
            `
        }

    }
];

export default announcements;

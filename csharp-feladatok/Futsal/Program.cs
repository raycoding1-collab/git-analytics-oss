using System.Text;

class Program
{
    private const int PlayerCount = 20;

    private static readonly Random random = new Random();

    private static readonly string[] LastNames =
    {
        "Kovács", "Nagy", "Szabó", "Tóth", "Horváth", "Kiss",
        "Varga", "Molnár", "Németh", "Farkas", "Balogh", "Papp"
    };

    private static readonly string[] FirstNames =
    {
        "Bence", "Máté", "Levente", "Dávid", "Ádám", "Gergő",
        "Márk", "Balázs", "Zoltán", "Péter", "Tamás", "Norbert"
    };

    static void Main()
    {
        Console.OutputEncoding = Encoding.UTF8;

        Player[] available = RandomPlayers(PlayerCount);
        Team team = new Team();
        string message = "";

        while (!team.IsFull)
        {
            Console.Clear();
            Console.WriteLine("Elérhető játékosok:");
            for (int i = 0; i < available.Length; i++)
            {
                Player player = available[i];
                string note = team.IsIncluded(player) ? "  [a csapatban]"
                    : !team.IsAvailable(player) ? "  [a poszt betelt]"
                    : "";
                Console.WriteLine($"{i + 1,3}. {player}{note}");
            }

            Console.WriteLine();
            Console.WriteLine($"A csapat ({team.NumberOfPlayers}/{Team.Size}):");
            Console.WriteLine(team);
            Console.WriteLine();

            if (message != "")
            {
                Console.WriteLine(message);
                message = "";
            }

            if (!available.Any(p => !team.IsIncluded(p) && team.IsAvailable(p)))
            {
                Console.WriteLine("Az elérhető játékosokból nem állítható össze teljes csapat.");
                return;
            }

            Console.Write("Válassz játékost (sorszám, 0 = kilépés): ");
            string? line = Console.ReadLine();
            if (line == null || line.Trim() == "0")
                return;

            if (!int.TryParse(line, out int choice) || choice < 1 || choice > available.Length)
            {
                message = "Érvénytelen sorszám.";
                continue;
            }

            Player selected = available[choice - 1];
            if (team.IsIncluded(selected))
            {
                message = $"{selected.Name} már a csapatban van.";
            }
            else if (!team.IsAvailable(selected))
            {
                message = $"Erre a posztra ({selected.Pos}) már nincs hely.";
            }
            else
            {
                team.Include(selected);
                message = $"{selected.Name} bekerült a csapatba.";
            }
        }

        Console.Clear();
        Console.WriteLine("A csapat összeállt:");
        Console.WriteLine(team);
    }

    static Player[] RandomPlayers(int count)
    {
        if (count > LastNames.Length * FirstNames.Length)
            throw new ArgumentOutOfRangeException(nameof(count), "Nincs elég különböző név.");

        Position[] positions = Enum.GetValues<Position>();
        HashSet<string> usedNames = new HashSet<string>();
        Player[] players = new Player[count];

        for (int i = 0; i < count; i++)
        {
            string name;
            do
            {
                name = $"{LastNames[random.Next(LastNames.Length)]} {FirstNames[random.Next(FirstNames.Length)]}";
            } while (!usedNames.Add(name));

            players[i] = new Player(name, positions[random.Next(positions.Length)]);
        }

        return players;
    }
}

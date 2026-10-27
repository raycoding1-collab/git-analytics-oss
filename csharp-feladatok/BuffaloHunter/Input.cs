static class Input
{
    // Addig kérdez, amíg min és max közötti egész számot nem kap.
    public static int ReadInt(string prompt, int min, int max)
    {
        while (true)
        {
            Console.Write(prompt);
            string? line = Console.ReadLine();
            if (line == null)
                Environment.Exit(0); // véget ért a bemenet

            if (int.TryParse(line, out int value) && value >= min && value <= max)
                return value;

            Console.WriteLine($"Adj meg egy egész számot {min} és {max} között!");
        }
    }
}

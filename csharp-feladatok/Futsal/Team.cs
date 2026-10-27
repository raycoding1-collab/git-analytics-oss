using System;

class Team
{
    public const int Size = 5;

    private readonly Player[] players = new Player[Size];

    public int NumberOfPlayers { get; private set; }

    public bool IsFull => NumberOfPlayers == Size;

    public bool IsIncluded(Player player)
    {
        for (int i = 0; i < NumberOfPlayers; i++)
        {
            if (players[i] == player)
                return true;
        }
        return false;
    }

    public bool IsAvailable(Player player)
    {
        int count = 0;
        for (int i = 0; i < NumberOfPlayers; i++)
        {
            if (players[i].Pos == player.Pos)
                count++;
        }
        return count < Capacity(player.Pos);
    }

    public void Include(Player player)
    {
        if (IsFull)
            throw new InvalidOperationException("A csapat már teljes.");
        if (IsIncluded(player))
            throw new InvalidOperationException($"{player.Name} már a csapat tagja.");
        if (!IsAvailable(player))
            throw new InvalidOperationException($"Erre a posztra ({player.Pos}) már nincs hely.");

        players[NumberOfPlayers++] = player;
    }

    // Felállás: 1 kapus, 1 csatár, 2 szélső, 1 védő.
    private static int Capacity(Position pos) => pos == Position.Winger ? 2 : 1;

    public override string ToString()
    {
        if (NumberOfPlayers == 0)
            return "  (még nincs játékos)";

        string result = "";
        for (int i = 0; i < NumberOfPlayers; i++)
        {
            if (i > 0)
                result += Environment.NewLine;
            result += $"  {players[i]}";
        }
        return result;
    }
}

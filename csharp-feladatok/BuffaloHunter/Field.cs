class Field
{
    // A (0, 0) mező helye a konzolon: előtte a sor-/oszlopszámok és a keret van.
    public const int OffsetX = 3;
    public const int OffsetY = 2;

    private readonly int size;

    public Field(int size)
    {
        this.size = size;
    }

    public int Size => size;
    public int TargetX => size - 1;
    public int TargetY => size - 1;

    public bool AllowedPosition(int x, int y) => x >= 0 && x < size && y >= 0 && y < size;

    public void Show()
    {
        string border = "+" + new string('-', size) + "+";

        // oszlopszámok a célzás megkönnyítésére
        Console.SetCursorPosition(OffsetX, 0);
        for (int x = 0; x < size; x++)
            Console.Write(x % 10);

        Console.SetCursorPosition(OffsetX - 1, OffsetY - 1);
        Console.Write(border);
        for (int y = 0; y < size; y++)
        {
            Console.SetCursorPosition(0, OffsetY + y);
            Console.Write($"{y % 10} |{new string(' ', size)}|");
        }
        Console.SetCursorPosition(OffsetX - 1, OffsetY + size);
        Console.Write(border);
    }
}

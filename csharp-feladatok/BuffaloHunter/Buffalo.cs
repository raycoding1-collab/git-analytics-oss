class Buffalo
{
    private static readonly Random random = new Random();

    // jobbra, lefelé, átlósan jobbra lefelé
    private static readonly (int Dx, int Dy)[] Steps = { (1, 0), (0, 1), (1, 1) };

    // a bal felső sarokból, a (0, 0) mezőről indul
    private int x;
    private int y;
    private bool active = true;

    public int X => x;
    public int Y => y;
    public bool IsActive => active;

    public void Move(Field field)
    {
        if (!active)
            return;

        var allowed = Steps.Where(s => field.AllowedPosition(x + s.Dx, y + s.Dy)).ToArray();
        if (allowed.Length == 0)
            return;

        var step = allowed[random.Next(allowed.Length)];
        x += step.Dx;
        y += step.Dy;
    }

    public void Deactivate() => active = false;

    public void Show()
    {
        Console.SetCursorPosition(Field.OffsetX + x, Field.OffsetY + y);
        Console.ForegroundColor = active ? ConsoleColor.Green : ConsoleColor.Red;
        Console.Write('B');
        Console.ResetColor();
    }
}

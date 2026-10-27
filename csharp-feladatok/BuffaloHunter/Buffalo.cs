using System;

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

        // a pályán belül maradó lépések sorszámai
        int[] allowed = new int[Steps.Length];
        int count = 0;
        for (int i = 0; i < Steps.Length; i++)
        {
            if (field.AllowedPosition(x + Steps[i].Dx, y + Steps[i].Dy))
                allowed[count++] = i;
        }
        if (count == 0)
            return;

        var step = Steps[allowed[random.Next(count)]];
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

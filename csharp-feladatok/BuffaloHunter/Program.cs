using System.Text;

class Program
{
    static void Main()
    {
        Console.OutputEncoding = Encoding.UTF8;
        Console.WriteLine("Bölényvadász");
        Console.WriteLine();

        int count = Input.ReadInt("A bölények száma (N, 1-50): ", 1, 50);
        int size = Input.ReadInt("A játéktér mérete (M, 2-20): ", 2, 20);

        Game game = new Game(size, count);
        game.Run();
    }
}

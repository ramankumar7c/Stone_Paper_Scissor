import java.util.*;

public class SPS {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        
        while(true){
            String []Moves={"Rock","Paper","Scissors"};

            String compMove = Moves[new Random().nextInt(Moves.length)];

            System.out.println("Computer has chosen its move");

            String userMove;

            while (true){
                System.out.println("Available moves: 'Rock', 'Paper', 'Scissors'");
                System.out.print("Enter your move : ");
                userMove = sc.nextLine();

                if(userMove.equals("Rock")||userMove.equals("Paper")||userMove.equals("Scissors")){
                    System.out.println("User's Move: "+userMove);
                    break;
                }
                System.out.println("Not a valid move. Enter a valid move from available moves.");
            }
            System.out.println("Computer's Move: "+compMove);

            if (userMove.equals(compMove))
                System.out.println("It's a tie.");
            else if (userMove.equals("Rock")) {
                if(compMove.equals("Paper"))
                    System.out.println("Computer won!");
                else
                    System.out.println("You won!");
            }
            else if (userMove.equals("Paper")) {
                if (compMove.equals("Scissors"))
                    System.out.println("Computer won!");
                else
                    System.out.println("You won!");
            }
            else if (userMove.equals("Scissors")) {
                if (compMove.equals("Rock"))
                    System.out.println("Computer won!");
                else
                    System.out.println("You won!");
            }
            String playAgain;
            System.out.println("Do you want to play again?");

            while (true){
                System.out.print("Type 'yes' or 'no' : ");
                playAgain=sc.nextLine();

                if(playAgain.equals("Yes")||playAgain.equals("yes")||playAgain.equals("No")||playAgain.equals("no"))
                    break;
                else
                    System.out.println("Enter valid choice");
            }
            if(playAgain.equals("no")||playAgain.equals("No"))
                break;
        }
    }
}

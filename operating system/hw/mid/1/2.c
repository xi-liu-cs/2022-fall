#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/wait.h>

int main()
{
    if(fork() == 0)
    {
        if(fork() == 0)
            printf("3");
        else
        {
            wait(0);
            printf("4");
        }
    }
    else{
        if(fork() == 0)
        {
            printf("1");
            exit(0);
        }
        printf("2");
    }
    printf("0");
    return 0;
}

/* gcc 1.3.c -o 1.3
./1.3 1.1 1.2 */

#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>

int main(int argc, char ** argv)
{
    char * prog[] = {"./1.1.exe", "./1.2.exe"},
    * new_argv[2];
    new_argv[1] = 0;

    *new_argv = *prog;
    int r1 = execve(*prog, new_argv, 0);
    if(r1 == -1)
        printf("error 1\n");
    
    *new_argv = prog[1];
    int r2 = execve(prog[1], new_argv, 0);
    if(r2 == -1)
        printf("error 2\n");
    printf("end of program\n");
    exit(0);
}
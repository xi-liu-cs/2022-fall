#include <stdio.h>
#define file FILE
#define end_file -1
#define null 0

char * fget(char * s, file * fp)
{
    int c;
    char * sp = s;
    while((c = getc(fp)) != end_file)
        if((*sp++ = c) == '\n')
            break;
    *sp = '\0';
    return (c == end_file && sp == s) ? null : s;
}

int main()
{
    file * fp = fopen("0.txt", "r+");
    char s[100];
    fget(s, fp);
    printf("%s", s);
    fget(s, fp);
    printf("%s", s);
}
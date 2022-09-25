#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <ctype.h>
#define file FILE
#define end_file EOF
int block = 128;

void * mal(size_t size)
{
    void * a = malloc(size);
    if(!a)
      printf("malloc error\n");
    return a;
}

void * rea(void * ptr, size_t size)
{
    void * a = realloc(ptr, size);
    if(!a)
      printf("realloc error\n");
    return a;
}

char ** file_to_array(file * fp, int * num_line)
{
    int cur_sz = block; 
    char ** lines = (char **)mal(cur_sz * sizeof(char *));
    *num_line = 0;
    char * line = 0;
    size_t len = 0;
    ssize_t nread;
    while((nread = getline(&line, &len, fp)) != end_file) 
    {
        if(*num_line >= cur_sz)
        {
            cur_sz += block;
            lines = (char **)rea(lines, cur_sz * sizeof(char *));
        }
        char * line_buf = (char *)mal(nread * sizeof(char));
        strcpy(line_buf, line);
        lines[(*num_line)++] = line_buf;
    }
    return lines;
}

void print_lines(char ** lines, int num_line)
{
    for(int i = 0; i < num_line; ++i)
        printf("%s", lines[i]);
    printf("\n");
}

int * split(char ** lines, int num_line, int num_int)
{
    int * num_array = (int *)mal((num_int + 1) * sizeof(int));
    int num_array_i = 0;
    for(int i = 0; i < num_line; ++i)
    {
        if(num_array_i >= num_int + 1)
            break;
        char * end_ptr = lines[i];
        while(num_array_i < num_int + 1)
        {
            num_array[num_array_i++] = strtof(end_ptr, &end_ptr);
            if(isspace((int)end_ptr[1]))
                break;
        }
    }
    return num_array;
}

void print_int(int * a, int len)
{
    for(int i = 0; i < len; ++i)
        printf("%d ", a[i]);
    printf("\n");
}

int main()
{
    file * fp = fopen("0.txt", "r");
    int num_line = 0;
    char ** lines = file_to_array(fp, &num_line);
    print_lines(lines, num_line);
    int n_proc = atoi(*lines),
    n_int = 4 * n_proc + 1;
    int * int_array = split(lines, num_line, n_int);
    print_int(int_array, n_int);
}
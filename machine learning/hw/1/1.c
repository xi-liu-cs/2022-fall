#include <stdio.h>
#include <stdlib.h>
#include <string.h>

int * strnum(char * s, int * res_n)
{/* string to numeric coefficient */
    int cur_num = 0, is_pos = 1, eq_seen = 0,
    n = strlen(s), * res = (int *)malloc(5 * sizeof(int)), _res_n = 0;
    for(int i = 0; i < n; ++i)
    {
        while(i < n && '0' <= s[i] && s[i] <= '9')
        {
            cur_num = cur_num * 10 + s[i] - '0';
            ++i;
        }
        if(eq_seen && cur_num)
            res[_res_n++] = is_pos ? cur_num : -cur_num;
        char c = s[i];
        if(c == '+')
            is_pos = 1;
        else if(c == '-')
            is_pos = 0;
        else if('a' <= c && c <= 'd')
        {
            res[c - 'a'] = is_pos ? cur_num : -cur_num;
            if(!res[c - 'a'])
                res[c - 'a'] = 1;
            cur_num = 0;
            ++_res_n;
        }
        else if(c == '=')
            eq_seen = 1;
    }
    *res_n = _res_n;
    return res;
}

int main()
{
    char * s = "a + 2 b - 10 c = -7";
    int n, * res = strnum(s, &n);
    for(int i = 0; i < n; ++i)
        printf("%d ", res[i]);
}

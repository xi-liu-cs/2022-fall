#include <iostream>
#include <queue>
#include <vector>
#include <string>
#include <unordered_map>
#include <fstream>
#include <algorithm>

using namespace std;

string ltrim(const string &);
string rtrim(const string &);



/*
 * Complete the 'getSeatsAllocation' function below.
 *
 * The function is expected to return an INTEGER_ARRAY.
 * The function accepts INTEGER_ARRAY arr as parameter.
 */
 
struct person 
{
    int seat, id;
    person(int s, int i)
    {
        seat = s;
        id = i;
    }
};

vector<int> getSeatsAllocation(vector<int> arr) {
    cout << "n = " << arr.size();
    for(int i = 0; i < arr.size(); ++i)
        cout << arr[i] << " ";
    queue<person> q;
    long long n = arr.size();
    for(long long i = 0; i < n; ++i)
        q.emplace(arr[i], i);
    unordered_map<int, int> fill;
    vector<int> res(n);
    while(!q.empty())
    {
        person cur = q.front();
        q.pop();
        if(!fill[cur.seat])
        {
            res[cur.id] = cur.seat;
            fill[cur.seat] = 1;
        }
        else
        {
            ++cur.seat;
            q.push(cur);
        }
    }
    return res;
}

int main()
{
    ofstream fout(getenv("OUTPUT_PATH"));

    string arr_count_temp;
    getline(cin, arr_count_temp);

    int arr_count = stoi(ltrim(rtrim(arr_count_temp)));

    vector<int> arr(arr_count);

    for (int i = 0; i < arr_count; i++) {
        string arr_item_temp;
        getline(cin, arr_item_temp);

        int arr_item = stoi(ltrim(rtrim(arr_item_temp)));

        arr[i] = arr_item;
    }

    vector<int> result = getSeatsAllocation(arr);

    for (size_t i = 0; i < result.size(); i++) {
        fout << result[i];

        if (i != result.size() - 1) {
            fout << "\n";
        }
    }

    fout << "\n";

    fout.close();

    return 0;
}

string ltrim(const string &str) {
    string s(str);

    s.erase(
        s.begin(),
        find_if(s.begin(), s.end(), not1(ptr_fun<int, int>(isspace)))
    );

    return s;
}

string rtrim(const string &str) {
    string s(str);

    s.erase(
        find_if(s.rbegin(), s.rend(), not1(ptr_fun<int, int>(isspace))).base(),
        s.end()
    );

    return s;
}
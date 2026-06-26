import sys
import json
import time

def main():
    try:
        input_data = sys.stdin.read()
        payload = json.loads(input_data)
        code = payload["code"]
        func_name = payload["funcName"]
        test_cases = payload["testCases"]
    except Exception as e:
        print(json.dumps({
            "error": f"Failed to parse input arguments: {str(e)}",
            "results": [],
            "overallPassed": False
        }))
        return

    # Restrict execution environment builtins
    safe_builtins = {
        "abs": abs, "all": all, "any": any, "bin": bin, "bool": bool, "chr": chr,
        "dict": dict, "divmod": divmod, "enumerate": enumerate, "filter": filter,
        "float": float, "format": format, "hash": hash, "hex": hex, "int": int,
        "isinstance": isinstance, "issubclass": issubclass, "iter": iter, "len": len,
        "list": list, "map": map, "max": max, "min": min, "next": next, "oct": oct,
        "ord": ord, "pow": pow, "range": range, "repr": repr, "reversed": reversed,
        "round": round, "set": set, "slice": slice, "sorted": sorted, "str": str,
        "sum": sum, "tuple": tuple, "zip": zip, "Exception": Exception, "ValueError": ValueError,
        "TypeError": TypeError, "KeyError": KeyError, "IndexError": IndexError, "AttributeError": AttributeError
    }
    
    safe_globals = {
        "__builtins__": safe_builtins
    }

    try:
        # Execute the user's code to define the solution function/class
        exec(code, safe_globals)
    except Exception as e:
        print(json.dumps({
            "error": f"Compilation/Syntax Error: {str(e)}",
            "results": [],
            "overallPassed": False
        }))
        return

    # Find the target function or Solution method
    func = None
    if "Solution" in safe_globals:
        try:
            sol_instance = safe_globals["Solution"]()
            func = getattr(sol_instance, func_name, None)
        except Exception as e:
            pass

    if func is None:
        func = safe_globals.get(func_name)

    if func is None:
        # Fallback: if there's only one callable function in the global space, use that!
        callables = [k for k, v in safe_globals.items() if callable(v) and k != "__builtins__" and k != "Solution"]
        if len(callables) == 1:
            func = safe_globals[callables[0]]

    if func is None:
        print(json.dumps({
            "error": f"Function '{func_name}' not found. Please define it in your pseudocode.",
            "results": [],
            "overallPassed": False
        }))
        return

    results = []
    overall_passed = True

    for idx, tc in enumerate(test_cases):
        inputs = tc.get("input", [])
        if not isinstance(inputs, list):
            inputs = [inputs]
        expected = tc.get("expected")

        try:
            start_time = time.time()
            actual = func(*inputs)
            elapsed = time.time() - start_time

            # Standard equivalence check
            passed = (actual == expected)

            results.append({
                "testCaseId": str(idx + 1),
                "passed": passed,
                "input": inputs,
                "expected": expected,
                "actual": actual
            })
            if not passed:
                overall_passed = False
        except Exception as e:
            overall_passed = False
            results.append({
                "testCaseId": str(idx + 1),
                "passed": False,
                "input": inputs,
                "expected": expected,
                "actual": f"Runtime Error: {str(e)}"
            })

    print(json.dumps({
        "results": results,
        "overallPassed": overall_passed
    }))

if __name__ == "__main__":
    main()

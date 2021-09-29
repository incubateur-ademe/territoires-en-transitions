import React, {FC, useState} from 'react';
import {FieldProps} from 'formik';
import {v4 as uuid} from 'uuid';
import {useAllStorables} from 'core-logic/hooks';
import {PlanActionStorable} from 'storables/PlanActionStorable';
import {planActionStore} from 'core-logic/api/hybridStores';
import {
  CategoryNode,
  nestPlanCategories,
} from 'app/pages/collectivite/PlanActions/sorting';
import {PlanActionTyped} from 'types/PlanActionTypedInterface';
import {Menu, MenuItem, Select} from '@material-ui/core';
import NestedMenuItem from 'app/pages/collectivite/Referentiels/NestedMenuItem';
import {PlanCategorie} from 'app/pages/collectivite/PlanActions/Forms/FicheActionForm';
import Autocomplete from '@material-ui/lab/Autocomplete';
import TextField from '@material-ui/core/TextField';
import * as R from 'ramda';

type LinkedPlanCategoriesFieldProps = {
  label: string;
  id?: string;
  hint?: string;
};

/**
 * Transform category nodes into a menu of nested items.
 */
const categoriesToItems = (
  categories: CategoryNode[],
  onSelect: (categoryUid: string) => void
): React.ReactNode[] => {
  return categories.map((node: CategoryNode): React.ReactNode => {
    if (node.children.length)
      return (
        <NestedMenuItem
          key={node.categorie.uid}
          parentMenuOpen={true}
          label={
            <div
              className="truncate max-w-sm"
              onClick={() => onSelect(node.categorie.uid)}
            >
              {node.categorie.nom}
            </div>
          }
        >
          {categoriesToItems(node.children, onSelect)}
        </NestedMenuItem>
      );
    return (
      <MenuItem key={node.categorie.uid}>
        <div
          className="truncate max-w-sm"
          onClick={() => onSelect(node.categorie.uid)}
        >
          {node.categorie.nom}
        </div>
      </MenuItem>
    );
  });
};

/**
 * Displays a dropdown to pick plan categories when its children are clicked.
 */
const PlanDropdown = (props: {
  plan: PlanActionStorable;
  onSelect: (categorieUid: string, planUid: string) => void;
  children: React.ReactNode;
}) => {
  const [opened, setOpened] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState<HTMLElement | null>(null);

  const plan = props.plan as PlanActionStorable & PlanActionTyped;
  const categories = nestPlanCategories(plan.categories);

  const menuId = plan.uid;

  return (
    <>
      <div
        className="cursor-pointer w-1/3"
        aria-controls={menuId}
        aria-haspopup="true"
        onClick={e => {
          setAnchorEl(e.currentTarget);
          setOpened(!opened);
        }}
      >
        {props.children}
      </div>
      <Menu
        id={menuId}
        open={opened}
        onClose={() => setOpened(false)}
        anchorEl={anchorEl}
        getContentAnchorEl={null}
        anchorOrigin={{vertical: 'bottom', horizontal: 'left'}}
        transformOrigin={{vertical: 'top', horizontal: 'left'}}
      >
        {categoriesToItems(categories, categorieUid => {
          props.onSelect(categorieUid, plan.uid);
        })}
      </Menu>
    </>
  );
};

type PlanActionStorableTyped = PlanActionStorable & PlanActionTyped;
/**
 * A plan category picker.
 *
 * Retrieve plans and allows user to select a category in a dropdown for
 * each plan.
 */
export const LinkedPlanCategoriesField: FC<
  LinkedPlanCategoriesFieldProps & FieldProps
> = ({
  field, // { name, value, onChange, onBlur }
  form: {touched, errors, setFieldValue},
  ...props
}) => {
  const plans = useAllStorables<PlanActionStorable>(
    planActionStore
  ) as PlanActionStorableTyped[];
  const htmlId = props.id ?? uuid();
  const errorMessage = errors[field.name];
  const isTouched = touched[field.name];
  const value = field.value as PlanCategorie[];
  const selectedPlans = R.filter(
    plan => !!value.find(categorie => categorie.planUid === plan.uid),
    plans
  );
  const isPlanInFieldValue = (planUid: string): boolean =>
    R.any(planCategorie => planCategorie.planUid === planUid, value);

  const handleCategorySelection = (categorieUid: string, planUid: string) => {
    const selected: PlanCategorie = {planUid, categorieUid};

    if (isPlanInFieldValue(planUid)) {
      setFieldValue(
        field.name,
        value.map((categorie: PlanCategorie) => {
          return categorie.planUid === planUid ? selected : categorie;
        })
      );
    } else {
      setFieldValue(field.name, [...value, selected]);
    }
    console.log(value);
  };

  const handlePlanSelection = (selectedPlans: PlanActionTyped[]) => {
    const newValue: PlanCategorie[] = selectedPlans.map(plan => {
      const matchingPlanCategorieInValue = value.find(
        planCategorie => planCategorie.planUid === plan.uid
      );
      return matchingPlanCategorieInValue ?? {planUid: plan.uid};
    });
    setFieldValue(field.name, newValue);
  };

  return (
    <fieldset className="block">
      {!errorMessage && props.hint && <div className="hint">{props.hint}</div>}
      {errorMessage && isTouched && <div className="hint">{errorMessage}</div>}

      <Autocomplete
        multiple
        id={htmlId}
        options={plans}
        className="bg-beige list-none"
        renderOption={plan => plan.nom}
        getOptionLabel={plan => plan.nom}
        value={selectedPlans}
        onChange={(e, value) => {
          handlePlanSelection(value);
        }}
        renderInput={params => (
          <TextField
            {...params}
            variant="outlined"
            label={props.label}
            placeholder={props.label}
          />
        )}
      />
      {!errorMessage && props.hint && <div className="hint">{props.hint}</div>}
      {errorMessage && isTouched && <div className="hint">{errorMessage}</div>}

      {selectedPlans.map(plan => {
        const selected = value.find(cat => cat.planUid === plan.uid);
        const categorie = R.find(categorie => {
          return categorie.uid === selected?.categorieUid;
        }, plan.categories);
        return (
          <div
            className="flex flex-row items-center gap-2 ml-4 my-4 w-full"
            key={plan.uid}
          >
            <div>{plan.nom} :</div>
            <PlanDropdown
              plan={plan}
              onSelect={(categorieUid: string) =>
                handleCategorySelection(categorieUid, plan.uid)
              }
              key={plan.uid}
            >
              <div className="border-gray-500 border-b-2 py-2 w-full">
                {!categorie && <span>Selectionner un axe</span>}
                {categorie && <span>{categorie.nom}</span>}
              </div>
            </PlanDropdown>
          </div>
        );
      })}
    </fieldset>
  );
};
